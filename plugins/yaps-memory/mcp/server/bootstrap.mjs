export async function resolveMemoryBootstrap({
  diagnoseAccount,
  diagnoseConnection,
  resolveConnector,
  resolveSession,
}) {
  let cli = await resolveSession();
  const connector = cli.path ? resolveConnector() : { path: null, source: null };
  const connection = diagnoseConnection({ cli, connector, needsConnector: true });
  if (connection.code !== "ready") {
    return { account: null, cli, connection, connector };
  }

  cli = await resolveSession({ cli, recoverAccount: true });
  return {
    account: diagnoseAccount(cli),
    cli,
    connection,
    connector,
  };
}
