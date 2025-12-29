# Notificaciones - Estado de Implementación

## Resumen de notificaciones

| Notificación | Tipo | Estado |
|--------------|------|--------|
| **Resumen mensual** | In-app (panel de campana, día 2 de cada mes) | **IMPLEMENTADO** |
| **Alerta de recordatorios** | Email (1 día antes del vencimiento) | **IMPLEMENTADO** |

---

# FASE 1: Resumen mensual in-app - IMPLEMENTADO

## Archivos creados/modificados

- `supabase/migrations/012_notification_preferences.sql` - Migración con columnas de preferencias
- `src/app/api/generate-monthly-summary/route.ts` - API route para generar resúmenes
- `src/app/(dashboard)/ajustes/page.tsx` - Guarda preferencias en DB
- `src/components/layout/NotificationsDropdown.tsx` - Soporte para tipo `monthly_summary`
- `vercel.json` - Configuración de cron mensual

## Pendiente para activar en producción

1. **Ejecutar migración en Supabase:**
   ```sql
   -- Ejecutar el contenido de supabase/migrations/012_notification_preferences.sql
   ```

2. **Añadir variables de entorno en Vercel Dashboard:**
   ```
   CRON_SECRET=un_secreto_largo_aleatorio
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

3. **Deploy a producción** - El cron se activará automáticamente

## Funcionamiento

- El día 2 de cada mes a las 9:00 AM UTC, Vercel ejecuta `/api/generate-monthly-summary`
- La API consulta usuarios con `in_app_monthly_summary = true`
- Para cada usuario, calcula ingresos, gastos, ahorro y balance del mes anterior
- Crea una notificación en la tabla `notifications` con tipo `monthly_summary`
- Las notificaciones aparecen en el panel de campana del Header

---

# FASE 2: Alerta de recordatorios por email - IMPLEMENTADO

> **Estado:** Código implementado. Pendiente verificar dominio en Resend y añadir variable de entorno.

## Requisitos previos

1. **Dominio comprado y verificado** en Resend
2. **Cuenta de Resend** (gratis hasta 3000 emails/mes)

## Pasos para implementar

### 2.1 Configurar Resend

1. Crear cuenta en https://resend.com
2. Verificar dominio del cliente (DNS records)
3. Obtener API Key
4. Añadir a Vercel:
   ```
   RESEND_API_KEY=re_xxxxxxxxxx
   ```

### 2.2 Instalar dependencia

```bash
npm install resend
```

### 2.3 Crear API route para enviar emails

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

### 2.4 Actualizar vercel.json

Añadir el cron de emails:

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

### 2.5 Deploy

Una vez configurado todo:
1. Hacer deploy a producción
2. Probar con un recordatorio de prueba

---

# Variables de entorno

| Variable | Fase 1 | Fase 2 | Descripción |
|----------|--------|--------|-------------|
| `CRON_SECRET` | Requerido | Requerido | Secreto para autenticar cron jobs |
| `SUPABASE_SERVICE_ROLE_KEY` | Requerido | Requerido | Service role key de Supabase |
| `RESEND_API_KEY` | - | Requerido | API key de Resend |

---

# Checklist

## Fase 1: Resumen mensual in-app

- [x] Crear migración para preferencias de notificaciones
- [x] Crear API route `/api/generate-monthly-summary`
- [x] Actualizar `ajustes/page.tsx` para guardar en DB
- [x] Actualizar componente de campana para tipo `monthly_summary`
- [x] Crear `vercel.json` con cron mensual
- [ ] Ejecutar migración en producción
- [ ] Añadir `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` a Vercel
- [ ] Deploy a producción
- [ ] Probar en producción

## Fase 2: Alertas de recordatorios por email

- [x] Comprar dominio (finybuddy.com)
- [x] Crear cuenta Resend
- [ ] Verificar dominio en Resend (DNS)
- [x] Instalar `resend`
- [ ] Añadir `RESEND_API_KEY` a Vercel
- [x] Crear API route `/api/send-reminder-emails`
- [x] Añadir cron diario a `vercel.json`
- [ ] Deploy a producción
- [ ] Probar envío de emails
