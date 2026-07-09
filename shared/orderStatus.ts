// Order status → French label / Tailwind color-class. Shared between the
// backend (status-change emails) and the frontend admin order screens —
// previously duplicated as separate copies in each.

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  preconfirmed: "Pré-confirmée",
  confirmed: "Confirmée",
  en_cours: "En cours de livraison",
  au_magasin: "Au magasin",
  retour_expediteur: "Retour expéditeur",
  retour_client: "Retour client/agence",
  retour_depot: "Retour dépôt",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export function getStatutLabel(statut: string): string {
  return ORDER_STATUS_LABELS[statut] ?? statut;
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preconfirmed: "bg-orange-100 text-orange-800",
  confirmed: "bg-blue-100 text-blue-800",
  en_cours: "bg-purple-100 text-purple-800",
  au_magasin: "bg-indigo-100 text-indigo-800",
  retour_expediteur: "bg-red-100 text-red-800",
  retour_client: "bg-red-100 text-red-700",
  retour_depot: "bg-gray-200 text-gray-700",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function getStatutColor(statut: string): string {
  return ORDER_STATUS_COLORS[statut] ?? "bg-gray-100 text-gray-800";
}
