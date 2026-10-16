// Same two users always get the same chat id, whoever writes first
export const chatIdFor = (a: string, b: string) => [a, b].sort().join("_");
