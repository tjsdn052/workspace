export const getRandomColor = () => {
  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ff00ff",
    "#fefe33",
    "#00ffff",
    "#FFA500",
    "#800080",
    "#008080",
    "#FFC0CB",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomName = () => {
  const names = [
    "Anonymous Ant",
    "Brave Bear",
    "Curious Cat",
    "Daring Dog",
    "Eager Elephant",
    "Funny Fox",
    "Gentle Giraffe",
    "Happy Hippo",
    "Icy Iguana",
    "Jolly Jellyfish",
    "Cheolsu",
    "Yeonghui",
    "Gildong",
  ];
  return names[Math.floor(Math.random() * names.length)];
};
