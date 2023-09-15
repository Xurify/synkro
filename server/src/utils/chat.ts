import { User } from '../../../src/types/interfaces';

export const usernameChatColors = [
  '#57cc99',
  '#d9d2ff',
  '#ff5400',
  '#ffe1a8',
  '#119f11',
  '#65debe',
  '#ee6c21',
  '#f8e33f',
  '#65debe',
  '#b969cc',
  '#3591fc',
  '#f189c9',
  '#c23a21',
  '#9ba2fd',
  '#ff5c8a',
  '#aaf683',
  '#ffee32',
  '#a5ffd6',
  '#84dcc6',
  '#38b000',
  '#f79d65',
  '#d84727',
  '#c0fdfb',
  '#c05299',
  '#ea698b',
  '#fcf300',
  '#5bdb70',
];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

export const assignUsernameChatColor = (members: User[]): string => {
  const currentlyUsedColors = members.map((member) => member.color);
  const unusedColors = usernameChatColors.filter((usernameChatColor) => !currentlyUsedColors.includes(usernameChatColor));
  const randomColor = unusedColors[getRandomInt(0, unusedColors.length)];
  return randomColor;
};
