# Pendiente: Configurar Emails de Notificaciones

> **Estado:** En espera hasta que el cliente tenga dominio comprado

## Requisitos previos

1. **Dominio comprado y verificado** en Resend
2. **Cuenta de Resend** (gratis hasta 3000 emails/mes)

---

## 1. Configurar Resend

1. Crear cuenta en https://resend.com
2. Verificar dominio del cliente (DNS records)
3. Obtener API Key
4. Añadir a `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxx
   ```

---

## 2. Instalar dependencia

```bash
npm install resend
```

---

## 3. Crear API route para enviar emails

Crear `src/app/api/send-reminder-email/route.ts`:

```typescript
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  // Verificar que viene de Vercel Cron (o Supabase Edge Function)
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

  const { data: reminders } = await supabase
    .from('reminders')
    .select(`
      *,
      profile:profiles(email, full_name)
    `)
    .eq('reminder_date', tomorrowStr)
    .eq('is_completed', false);

  // Obtener usuarios con notificaciones activadas
  // (leer de localStorage no es posible en server, guardar en DB o en profiles)

  for (const reminder of reminders || []) {
    await resend.emails.send({
      from: 'FinyBuddy <notificaciones@tudominio.com>',
      to: reminder.profile.email,
      subject: `Recordatorio: ${reminder.concept} vence mañana`,
      html: `
        <h2>Hola ${reminder.profile.full_name || ''}!</h2>
        <p>Te recordamos que mañana vence:</p>
        <p><strong>${reminder.concept}</strong></p>
        <p>Importe: ${reminder.amount} EUR</p>
        <p>Fecha: ${tomorrowStr}</p>
        <br>
        <p>- El equipo de FinyBuddy</p>
      `,
    });
  }

  return Response.json({ sent: reminders?.length || 0 });
}
```

---

## 4. Configurar Vercel Cron

Crear `vercel.json` en la raíz:

```json
{
  "crons": [
    {
      "path": "/api/send-reminder-email",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Esto ejecuta el cron todos los días a las 8:00 AM UTC.

Añadir a `.env.local` y Vercel:
```
CRON_SECRET=un_secreto_largo_aleatorio
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

---

## 5. Guardar preferencias de notificaciones en DB

Actualmente las notificaciones se guardan en `localStorage`. Para que el cron pueda saber qué usuarios tienen activadas las alertas, hay que:

1. Añadir columnas a `profiles`:
   ```sql
   ALTER TABLE profiles
   ADD COLUMN email_reminder_alerts boolean DEFAULT true,
   ADD COLUMN in_app_monthly_summary boolean DEFAULT true;
   ```

2. Actualizar `ajustes/page.tsx` para guardar en DB en vez de localStorage

---

## 6. Resumen mensual in-app (día 2 de cada mes)

Para el resumen mensual que aparece en el panel de notificaciones:

1. Crear tabla `notifications` si no existe:
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
   ```

2. Crear cron que se ejecute el día 2 de cada mes:
   ```json
   {
     "path": "/api/generate-monthly-summary",
     "schedule": "0 9 2 * *"
   }
   ```

3. La API genera el resumen del mes anterior y lo guarda en `notifications`

---

## Checklist cuando tengan dominio

- [ ] Comprar dominio
- [ ] Crear cuenta Resend
- [ ] Verificar dominio en Resend (DNS)
- [ ] Añadir variables de entorno
- [ ] Instalar `resend`
- [ ] Crear API routes
- [ ] Configurar `vercel.json` con crons
- [ ] Migrar preferencias de localStorage a DB
- [ ] Probar envío de emails
- [ ] Deploy a producción
