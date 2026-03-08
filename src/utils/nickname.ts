export function GenerateNickname() {

  const adjectives = ["silent", "ghost", "shadow", "hidden", "misty"];
  const nouns = ["fox", "wolf", "hawk", "storm", "echo"];

  const nickname =
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    "_" +
    nouns[Math.floor(Math.random() * nouns.length)] +
    "_" +
    Math.floor(Math.random() * 1000);

    return nickname;
}
