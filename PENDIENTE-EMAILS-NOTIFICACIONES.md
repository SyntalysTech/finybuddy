# Pendiente: Configurar Notificaciones

> **Estado:** En espera hasta que el cliente tenga dominio comprado (solo para emails)

## Resumen de notificaciones

| Notificación | Tipo | Requiere dominio/Resend |
|--------------|------|-------------------------|
| **Alerta de recordatorios** | Email (1 día antes del vencimiento) | ✅ Sí |
| **Resumen mensual** | In-app (panel de campana, día 2 de cada mes) | ❌ No |

---

# PARTE 1: Resumen mensual in-app (NO requiere dominio)

Esta parte se puede implementar ya, sin necesidad de dominio ni Resend.

## 1.1 Crear tabla `notifications`

```sql
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

## 1.2 Crear API route para generar resumen mensual

Crear `src/app/api/generate-monthly-summary/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Calcular mes anterior
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const monthName = lastMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Obtener usuarios con resumen mensual activado
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, in_app_monthly_summary')
    .eq('in_app_monthly_summary', true);

  let created = 0;

  for (const user of users || []) {
    // Obtener operaciones del mes anterior
    const { data: operations } = await supabase
      .from('operations')
      .select('type, amount')
      .eq('user_id', user.id)
      .gte('operation_date', lastMonth.toISOString().split('T')[0])
      .lte('operation_date', lastMonthEnd.toISOString().split('T')[0]);

    if (!operations || operations.length === 0) continue;

    const income = operations
      .filter(op => op.type === 'income')
      .reduce((sum, op) => sum + op.amount, 0);
    const expenses = operations
      .filter(op => op.type === 'expense')
      .reduce((sum, op) => sum + op.amount, 0);
    const savings = operations
      .filter(op => op.type === 'savings')
      .reduce((sum, op) => sum + op.amount, 0);
    const balance = income - expenses;

    // Crear notificación
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: `Resumen de ${monthName}`,
      message: `Ingresos: ${income.toFixed(2)}€ | Gastos: ${expenses.toFixed(2)}€ | Ahorro: ${savings.toFixed(2)}€ | Balance: ${balance >= 0 ? '+' : ''}${balance.toFixed(2)}€`,
      type: 'monthly_summary',
    });

    created++;
  }

  return Response.json({ created });
}
```

## 1.3 Configurar Vercel Cron para resumen mensual

En `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/generate-monthly-summary",
      "schedule": "0 9 2 * *"
    }
  ]
}
```

Esto se ejecuta el día 2 de cada mes a las 9:00 AM UTC.

## 1.4 Migrar preferencia a DB

Añadir columna a `profiles`:

```sql
ALTER TABLE profiles
ADD COLUMN in_app_monthly_summary boolean DEFAULT true;
```

Actualizar `ajustes/page.tsx` para guardar `in_app_monthly_summary` en DB en vez de localStorage.

## 1.5 Mostrar notificaciones en el panel de campana

Actualizar el componente de notificaciones del Header para leer de la tabla `notifications`.

---

# PARTE 2: Alerta de recordatorios por email (REQUIERE dominio)

Esta parte requiere dominio comprado y verificado en Resend.

## Requisitos previos

1. **Dominio comprado y verificado** en Resend
2. **Cuenta de Resend** (gratis hasta 3000 emails/mes)

## 2.1 Configurar Resend

1. Crear cuenta en https://resend.com
2. Verificar dominio del cliente (DNS records)
3. Obtener API Key
4. Añadir a `.env.local` y Vercel:
   ```
   RESEND_API_KEY=re_xxxxxxxxxx
   ```

## 2.2 Instalar dependencia

```bash
npm install resend
```

## 2.3 Crear API route para enviar emails

Crear `src/app/api/send-reminder-email/route.ts`:

```typescript
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener recordatorios que vencen mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Obtener recordatorios con usuarios que tienen email_reminder_alerts activado
  const { data: reminders } = await supabase
    .from('reminders')
    .select(`
      *,
      profile:profiles!inner(id, email, full_name, email_reminder_alerts)
    `)
    .eq('reminder_date', tomorrowStr)
    .eq('is_completed', false)
    .eq('profiles.email_reminder_alerts', true);

  let sent = 0;

  for (const reminder of reminders || []) {
    try {
      await resend.emails.send({
        from: 'FinyBuddy <notificaciones@tudominio.com>', // Cambiar por dominio real
        to: reminder.profile.email,
        subject: `Recordatorio: ${reminder.concept} vence mañana`,
        html: `
          <h2>Hola ${reminder.profile.full_name || ''}!</h2>
          <p>Te recordamos que mañana vence:</p>
          <p><strong>${reminder.concept}</strong></p>
          <p>Importe: ${reminder.amount} €</p>
          <p>Fecha: ${tomorrowStr}</p>
          <br>
          <p>- El equipo de FinyBuddy</p>
        `,
      });
      sent++;
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  return Response.json({ sent });
}
```

## 2.4 Configurar Vercel Cron para emails

Añadir a `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/generate-monthly-summary",
      "schedule": "0 9 2 * *"
    },
    {
      "path": "/api/send-reminder-email",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Esto ejecuta el envío de emails todos los días a las 8:00 AM UTC.

## 2.5 Migrar preferencia a DB

Añadir columna a `profiles`:

```sql
ALTER TABLE profiles
ADD COLUMN email_reminder_alerts boolean DEFAULT true;
```

Actualizar `ajustes/page.tsx` para guardar `email_reminder_alerts` en DB en vez de localStorage.

---

# Variables de entorno necesarias

En `.env.local` y en Vercel Dashboard:

```
CRON_SECRET=un_secreto_largo_aleatorio
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
RESEND_API_KEY=re_xxxxxxxxxx  # Solo cuando tengan dominio
```

---

# Checklist

## Fase 1: Resumen mensual in-app (se puede hacer ya)

- [ ] Crear tabla `notifications` en Supabase
- [ ] Crear API route `/api/generate-monthly-summary`
- [ ] Añadir columna `in_app_monthly_summary` a `profiles`
- [ ] Actualizar `ajustes/page.tsx` para guardar en DB
- [ ] Actualizar componente de campana para leer notificaciones
- [ ] Configurar `vercel.json` con cron mensual
- [ ] Añadir `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` a Vercel
- [ ] Probar en producción

## Fase 2: Alertas de recordatorios por email (cuando tengan dominio)

- [ ] Comprar dominio
- [ ] Crear cuenta Resend
- [ ] Verificar dominio en Resend (DNS)
- [ ] Instalar `resend`
- [ ] Añadir `RESEND_API_KEY` a Vercel
- [ ] Crear API route `/api/send-reminder-email`
- [ ] Añadir columna `email_reminder_alerts` a `profiles`
- [ ] Actualizar `ajustes/page.tsx` para guardar en DB
- [ ] Añadir cron diario a `vercel.json`
- [ ] Probar envío de emails
- [ ] Deploy a producción
