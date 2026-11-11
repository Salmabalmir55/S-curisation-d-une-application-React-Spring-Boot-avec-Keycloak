import { useCallback, useEffect, useMemo, useState } from 'react';
import keycloak from './keycloak.js';
import { appelerApi } from './api.js';

export default function App() {
  const token = keycloak.tokenParsed ?? {};
  const roles = token.realm_access?.roles ?? [];
  const isAdmin = roles.includes('ADMIN');
  const username = token.preferred_username ?? 'Utilisateur';
  const [objet, setObjet] = useState('');
  const [mesDemandes, setMesDemandes] = useState([]);
  const [toutes, setToutes] = useState([]);
  const [profil, setProfil] = useState(null);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setErreur('');
    try {
      const [profilData, demandesData] = await Promise.all([
        appelerApi('/api/profil'),
        appelerApi('/api/demandes'),
      ]);
      setProfil(profilData);
      setMesDemandes(demandesData);
      if (isAdmin) setToutes(await appelerApi('/api/admin/demandes'));
    } catch (error) {
      setErreur(error.message);
    } finally {
      setChargement(false);
    }
  }, [isAdmin]);

  useEffect(() => { charger(); }, [charger]);

  async function creer(event) {
    event.preventDefault();
    setMessage(''); setErreur('');
    try {
      await appelerApi('/api/demandes', { method: 'POST', body: JSON.stringify({ objet }) });
      setObjet(''); setMessage('Votre demande a été créée.'); await charger();
    } catch (error) { setErreur(error.message); }
  }

  async function changerStatut(id, statut) {
    setMessage(''); setErreur('');
    try {
      await appelerApi(`/api/admin/demandes/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) });
      setMessage(`Demande ${statut === 'VALIDEE' ? 'validée' : 'refusée'}.`); await charger();
    } catch (error) { setErreur(error.message); }
  }

  const salut = useMemo(() => token.given_name ? `Bonjour, ${token.given_name}` : `Bonjour, ${username}`, [token.given_name, username]);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#accueil" aria-label="Accueil demandes"><span className="brand-mark">D</span><span>Demandes<span className="brand-dot">.</span><small>ESPACE SÉCURISÉ</small></span></a>
        <div className="top-actions"><span className="secure"><i /> Session protégée</span><button className="button button-quiet" onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>Se déconnecter <span aria-hidden="true">↗</span></button></div>
      </header>

      <section className="welcome" id="accueil">
        <div><div className="eyebrow">PORTAIL DE SUIVI</div><h1>{salut}<span className="accent">.</span></h1><p>Créez une demande et suivez son évolution depuis votre espace.</p></div>
        <div className="identity-card"><div className="avatar">{username.slice(0, 1).toUpperCase()}</div><div><strong>{username}</strong><span>{isAdmin ? 'Administrateur' : 'Utilisateur'}</span></div><span className="role-badge">{isAdmin ? 'ADMIN' : 'USER'}</span></div>
      </section>

      {(message || erreur) && <div className={`notice ${erreur ? 'notice-error' : 'notice-success'}`} role="status">{erreur || message}<button onClick={() => { setErreur(''); setMessage(''); }} aria-label="Fermer">×</button></div>}

      <div className="content-grid">
        <section className="panel create-panel">
          <div className="panel-heading"><div><span className="icon-tile">＋</span><div><div className="eyebrow">NOUVELLE REQUÊTE</div><h2>Créer une demande</h2></div></div><span className="step-number">01</span></div>
          <p className="panel-copy">Décrivez votre besoin en quelques mots. L'équipe pourra ensuite le traiter.</p>
          <form onSubmit={creer} className="request-form"><label htmlFor="objet">Objet de la demande</label><textarea id="objet" value={objet} onChange={(event) => setObjet(event.target.value)} placeholder="Ex. Accès à une ressource, assistance technique…" maxLength={500} required /><div className="form-footer"><span>{objet.length}/500 caractères</span><button className="button button-primary" disabled={!objet.trim()}>Envoyer la demande <span aria-hidden="true">→</span></button></div></form>
        </section>

        <section className="panel summary-panel">
          <div className="eyebrow">VOTRE ESPACE</div><h2>En un coup d'œil</h2><div className="stat"><div><span className="stat-label">Mes demandes</span><strong>{mesDemandes.length}</strong></div><span className="stat-icon">▤</span></div><div className="stat-foot"><span className="status-dot" /> {mesDemandes.filter((d) => d.statut === 'EN_ATTENTE').length} en attente de traitement</div><div className="divider" /><div className="session-line"><span>Connecté en tant que</span><strong>{profil?.username ?? username}</strong></div>
        </section>
      </div>

      <section className="panel list-panel">
        <div className="section-title"><div><div className="eyebrow">SUIVI PERSONNEL</div><h2>Mes demandes</h2></div><span className="count-pill">{mesDemandes.length} demande{mesDemandes.length > 1 ? 's' : ''}</span></div>
        {chargement ? <div className="empty-state"><span className="spinner" />Chargement de vos demandes…</div> : mesDemandes.length === 0 ? <div className="empty-state"><span className="empty-icon">▤</span><strong>Aucune demande pour le moment</strong><span>Vos demandes apparaîtront ici après leur envoi.</span></div> : <div className="table-wrap"><table><thead><tr><th>RÉFÉRENCE</th><th>OBJET</th><th>STATUT</th></tr></thead><tbody>{mesDemandes.map((d) => <tr key={d.id}><td className="reference">#{String(d.id).padStart(4, '0')}</td><td>{d.objet}</td><td><span className={`status status-${d.statut.toLowerCase()}`}><i />{labelStatut(d.statut)}</span></td></tr>)}</tbody></table></div>}
      </section>

      {isAdmin && <section className="panel admin-panel"><div className="section-title"><div><div className="eyebrow">ESPACE ADMINISTRATEUR</div><h2>Toutes les demandes</h2></div><span className="count-pill">{toutes.length} au total</span></div>{toutes.length === 0 ? <div className="empty-state compact">Aucune demande à traiter.</div> : <div className="table-wrap"><table><thead><tr><th>RÉFÉRENCE</th><th>DEMANDEUR</th><th>OBJET</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>{toutes.map((d) => <tr key={d.id}><td className="reference">#{String(d.id).padStart(4, '0')}</td><td>{d.username}</td><td>{d.objet}</td><td><span className={`status status-${d.statut.toLowerCase()}`}><i />{labelStatut(d.statut)}</span></td><td>{d.statut === 'EN_ATTENTE' ? <div className="row-actions"><button className="button-small approve" onClick={() => changerStatut(d.id, 'VALIDEE')}>Valider</button><button className="button-small reject" onClick={() => changerStatut(d.id, 'REFUSEE')}>Refuser</button></div> : <span className="muted">Traitée</span>}</td></tr>)}</tbody></table></div>}</section>}

      <footer><span>DEMANDES<span className="brand-dot">.</span></span><span>Authentification centralisée avec Keycloak <b>·</b> OpenID Connect + PKCE</span></footer>
    </main>
  );
}

function labelStatut(statut) {
  return ({ EN_ATTENTE: 'En attente', VALIDEE: 'Validée', REFUSEE: 'Refusée' })[statut] ?? statut;
}
