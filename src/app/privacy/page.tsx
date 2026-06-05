export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>Politique de Confidentialité</h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>Hamid Cargo — Dernière mise à jour : juin 2026</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem' }}>1. Données collectées</h2>
        <p>Dans le cadre de notre service de transit de colis entre la Chine et le Togo, nous collectons les données suivantes :</p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
          <li>Nom et prénom du destinataire</li>
          <li>Numéro de téléphone (WhatsApp)</li>
          <li>Numéro de suivi du colis</li>
          <li>Poids et type d'envoi</li>
          <li>Photos du colis</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem' }}>2. Utilisation des données</h2>
        <p>Vos données sont utilisées uniquement pour :</p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
          <li>Assurer le suivi et la livraison de votre colis</li>
          <li>Vous envoyer des notifications WhatsApp sur l'état de votre colis</li>
          <li>Vous contacter en cas de besoin</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem' }}>3. Partage des données</h2>
        <p>Nous ne vendons ni ne partageons vos données personnelles avec des tiers, sauf obligation légale.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem' }}>4. Notifications WhatsApp</h2>
        <p>En fournissant votre numéro de téléphone, vous acceptez de recevoir des notifications WhatsApp concernant l'état de votre colis. Vous pouvez demander à tout moment la suppression de vos données.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem' }}>5. Conservation des données</h2>
        <p>Vos données sont conservées pendant la durée nécessaire à la livraison de votre colis, puis archivées pour une durée maximale de 2 ans.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem' }}>6. Contact</h2>
        <p>Pour toute question ou demande de suppression de vos données :</p>
        <p style={{ marginTop: '0.5rem' }}>
          📞 WhatsApp / Appel : <strong>+228 70 15 13 30</strong>
        </p>
      </section>
    </main>
  )
}
