// Email Service for Tour Reports
// This service handles the preparation and sending of tour reports to supervisors

import { Tour, Visit, TourNote, Client, User } from '@/types';
import {
  getTour,
  getVisitsByTour,
  getTourNotes,
  getClient,
  getUser,
  getSupervisorIds,
  markTourReportSent,
} from './storage';

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface TourReportEmail {
  to: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody: string;
}

// Generate the email content for a tour report
export function generateTourReportEmail(
  tour: Tour,
  visits: Visit[],
  notes: TourNote[],
  clients: Map<string, Client>,
  commercial: User,
  supervisors: User[]
): TourReportEmail {
  // Stats
  const completedVisits = visits.filter((v) => v.status === 'completed').length;
  const absentVisits = visits.filter((v) => v.status === 'absent').length;
  const pendingVisits = visits.length - completedVisits - absentVisits;
  const totalDistance = tour.totalDistance
    ? (tour.totalDistance / 1000).toFixed(1)
    : '—';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const subject = `[Clozer] Rapport de tournée - ${tour.name} - ${formatDate(tour.date)}`;

  // Build recipient list
  const to: EmailRecipient[] = supervisors.map((s) => ({
    name: s.name,
    email: s.email,
  }));

  // HTML body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 5px 0 0; opacity: 0.9; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .stats { display: flex; gap: 10px; margin: 20px 0; }
    .stat { flex: 1; text-align: center; padding: 15px; border-radius: 8px; }
    .stat-completed { background: #dcfce7; color: #166534; }
    .stat-absent { background: #fef3c7; color: #92400e; }
    .stat-pending { background: #f3f4f6; color: #4b5563; }
    .stat-distance { background: #dbeafe; color: #1e40af; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; }
    .section { margin: 20px 0; }
    .section-title { font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .note { background: white; padding: 10px; border-radius: 4px; margin: 5px 0; border-left: 3px solid #3b82f6; }
    .note-time { font-size: 12px; color: #6b7280; }
    .visit { background: white; padding: 10px; border-radius: 4px; margin: 5px 0; display: flex; justify-content: space-between; align-items: center; }
    .visit-completed { border-left: 3px solid #22c55e; }
    .visit-absent { border-left: 3px solid #f59e0b; }
    .visit-pending { border-left: 3px solid #9ca3af; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .badge-completed { background: #dcfce7; color: #166534; }
    .badge-absent { background: #fef3c7; color: #92400e; }
    .badge-pending { background: #f3f4f6; color: #4b5563; }
    .report { background: white; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rapport de tournée</h1>
      <p>${tour.name} - ${formatDate(tour.date)}</p>
      <p>Commercial : ${commercial.name}</p>
    </div>
    
    <div class="content">
      <div class="stats">
        <div class="stat stat-completed">
          <div class="stat-value">${completedVisits}</div>
          <div class="stat-label">Terminées</div>
        </div>
        <div class="stat stat-absent">
          <div class="stat-value">${absentVisits}</div>
          <div class="stat-label">Absents</div>
        </div>
        <div class="stat stat-pending">
          <div class="stat-value">${pendingVisits}</div>
          <div class="stat-label">Non visitées</div>
        </div>
        <div class="stat stat-distance">
          <div class="stat-value">${totalDistance}</div>
          <div class="stat-label">km</div>
        </div>
      </div>

      ${tour.finalReport ? `
      <div class="section">
        <div class="section-title">RAPPORT FINAL</div>
        <div class="report">${tour.finalReport}</div>
      </div>
      ` : ''}

      ${notes.length > 0 ? `
      <div class="section">
        <div class="section-title">NOTES DE TERRAIN (${notes.length})</div>
        ${notes.map((note) => `
          <div class="note">
            <div class="note-time">${new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>${note.content}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">VISITES (${visits.length})</div>
        ${visits.map((visit) => {
          const client = clients.get(visit.clientId);
          const statusClass = visit.status === 'completed' ? 'completed' : visit.status === 'absent' ? 'absent' : 'pending';
          const statusLabel = visit.status === 'completed' ? 'Terminée' : visit.status === 'absent' ? 'Absent' : 'Non visitée';
          return `
          <div class="visit visit-${statusClass}">
            <div>
              <strong>${client ? `${client.civilite} ${client.nom} ${client.prenom}` : 'Client inconnu'}</strong>
              <br><small>${client ? `${client.adresse}, ${client.ville}` : ''}</small>
              ${visit.notes ? `<br><em style="color: #6b7280; font-size: 12px;">${visit.notes}</em>` : ''}
            </div>
            <span class="badge badge-${statusClass}">${statusLabel}</span>
          </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="footer">
      <p>Ce rapport a été généré automatiquement par Clozer.</p>
      <p>© ${new Date().getFullYear()} Clozer - Gestion de tournées commerciales</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Plain text body
  const textBody = `
RAPPORT DE TOURNÉE
==================
${tour.name} - ${formatDate(tour.date)}
Commercial : ${commercial.name}

RÉSUMÉ
------
- Visites terminées : ${completedVisits}
- Clients absents : ${absentVisits}
- Non visitées : ${pendingVisits}
- Distance parcourue : ${totalDistance} km

${tour.finalReport ? `
RAPPORT FINAL
-------------
${tour.finalReport}
` : ''}

${notes.length > 0 ? `
NOTES DE TERRAIN
----------------
${notes.map((note) => `[${new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}] ${note.content}`).join('\n')}
` : ''}

VISITES
-------
${visits.map((visit) => {
  const client = clients.get(visit.clientId);
  const statusLabel = visit.status === 'completed' ? '[✓]' : visit.status === 'absent' ? '[!]' : '[ ]';
  return `${statusLabel} ${client ? `${client.civilite} ${client.nom} ${client.prenom}` : 'Client inconnu'} - ${client?.ville || ''}`;
}).join('\n')}

--
Ce rapport a été généré automatiquement par Clozer.
  `.trim();

  return {
    to,
    subject,
    htmlBody,
    textBody,
  };
}

// Send tour report to supervisors
// This function prepares the email and can be extended to use actual email providers
export async function sendTourReportEmail(tourId: string): Promise<{
  success: boolean;
  message: string;
  recipients?: string[];
}> {
  try {
    // Get tour data
    const tour = getTour(tourId);
    if (!tour) {
      return { success: false, message: 'Tournée non trouvée' };
    }

    if (!tour.reportValidatedAt) {
      return { success: false, message: 'Le rapport doit être validé avant envoi' };
    }

    // Get commercial info
    const commercial = tour.userId ? getUser(tour.userId) : null;
    if (!commercial) {
      return { success: false, message: 'Commercial non trouvé' };
    }

    // Get supervisors
    const supervisorIds = getSupervisorIds(commercial.id);
    if (supervisorIds.length === 0) {
      return { success: false, message: 'Aucun superviseur configuré pour ce commercial' };
    }

    const supervisors = supervisorIds
      .map((id) => getUser(id))
      .filter((u): u is User => u !== undefined);

    if (supervisors.length === 0) {
      return { success: false, message: 'Superviseurs non trouvés' };
    }

    // Get visits and notes
    const visits = getVisitsByTour(tourId);
    const notes = getTourNotes(tourId);

    // Get clients
    const clients = new Map<string, Client>();
    visits.forEach((v) => {
      const client = getClient(v.clientId);
      if (client) clients.set(v.clientId, client);
    });

    // Generate email
    const email = generateTourReportEmail(
      tour,
      visits,
      notes,
      clients,
      commercial,
      supervisors
    );

    // TODO: Implement actual email sending here
    // Options:
    // 1. Use Vercel's built-in email (if available)
    // 2. Use Resend (https://resend.com)
    // 3. Use SendGrid
    // 4. Use AWS SES
    // 
    // For now, we just log and mark as sent
    console.log('📧 Email would be sent to:', email.to.map((r) => r.email).join(', '));
    console.log('📧 Subject:', email.subject);
    
    // Mark tour as report sent
    await markTourReportSent(tourId);

    return {
      success: true,
      message: `Rapport envoyé à ${supervisors.length} superviseur${supervisors.length > 1 ? 's' : ''}`,
      recipients: supervisors.map((s) => s.email),
    };
  } catch (error) {
    console.error('Error sending tour report email:', error);
    return {
      success: false,
      message: 'Erreur lors de l\'envoi du rapport',
    };
  }
}

// Preview email content (for debugging or showing to user)
export function previewTourReportEmail(tourId: string): TourReportEmail | null {
  const tour = getTour(tourId);
  if (!tour) return null;

  const commercial = tour.userId ? getUser(tour.userId) : null;
  if (!commercial) return null;

  const supervisorIds = getSupervisorIds(commercial.id);
  const supervisors = supervisorIds
    .map((id) => getUser(id))
    .filter((u): u is User => u !== undefined);

  const visits = getVisitsByTour(tourId);
  const notes = getTourNotes(tourId);

  const clients = new Map<string, Client>();
  visits.forEach((v) => {
    const client = getClient(v.clientId);
    if (client) clients.set(v.clientId, client);
  });

  return generateTourReportEmail(tour, visits, notes, clients, commercial, supervisors);
}
