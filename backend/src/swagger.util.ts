export function shouldSetupSwagger(
  nodeEnv = process.env.NODE_ENV,
): boolean {
  return nodeEnv !== 'production';
}
