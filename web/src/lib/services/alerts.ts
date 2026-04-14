// TODO: implement alerts service

export async function getAlerts(userId: string): Promise<any[]> {
  // TODO: implement alerts query from Firestore
  return [];
}

export async function createAlert(userId: string, alert: any): Promise<string> {
  // TODO: implement alert creation
  return 'mock-alert-id';
}

export async function deleteAlert(userId: string, alertId: string): Promise<void> {
  // TODO: implement alert deletion
}

export async function updateAlert(userId: string, alertId: string, data: any): Promise<void> {
  // TODO: implement alert update
}
