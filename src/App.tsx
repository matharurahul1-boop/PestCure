import React from 'react';
import { AuthGate } from './workspace/AuthGate';
import WorkspaceApp from './workspace/WorkspaceApp';

export default function App() {
  return <AuthGate>{auth => <WorkspaceApp key={auth.user?.id} auth={auth} />}</AuthGate>;
}
