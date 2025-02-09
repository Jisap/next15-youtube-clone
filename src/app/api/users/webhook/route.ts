import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {                                          // Clerk hara una petición POST al webhook cuando se envíe un evento relacionado con un usuario
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)                                            // Se inicializa un objeto Webhook de svix, que se usa para verificar la firma del webhook.

  // Get headers
  const headerPayload = await headers()                                             // Se obtienen los headers del request
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)                                             // Se extrae el body de la petición.

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {                                                        // Se intenta verificar la autenticidad del webhook usando wh.verify().
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Do something with payload
  // For this guide, log payload to console
  const { id } = evt.data
  const eventType = evt.type                                                        // Verificada su autenticidad se extrae el id del evento y su type para identificarlos en los logs.
  console.log(`Received webhook with ID ${id} and event type of ${eventType}`)      // Se realizan las acciones que se deseen con el webhook.
  console.log('Webhook payload:', body)

  return new Response('Webhook received', { status: 200 })
}