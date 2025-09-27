// Konfiguration für E-Mail-Versand von einer statischen GitHub Pages Seite.
// Wähle einen Provider und trage deine Keys/Endpoint ein.
export type EmailProvider = 'emailjs' | 'formspree' | 'disabled'

export const EMAIL_PROVIDER: EmailProvider = 'disabled' // 'emailjs' oder 'formspree'

// EmailJS (https://www.emailjs.com/)
// Lege ein Template an, das die Felder `to_email`, `subject`, `message` akzeptiert.
export const EMAILJS = {
  service_id: 'YOUR_SERVICE_ID',
  template_id: 'YOUR_TEMPLATE_ID',
  public_key: 'YOUR_PUBLIC_KEY',
  to_email: 'ziel@example.com', // Empfängeradresse im Template nutzen
}

// Formspree (https://formspree.io/)
// Erstelle ein Formular und setze hier die Endpoint-ID (z. B. https://formspree.io/f/xxxxxx)
export const FORMSPREE = {
  endpoint: 'https://formspree.io/f/XXXXXXXX', // ersetzen
  to_email: 'ziel@example.com', // optional in der Nachricht
}
