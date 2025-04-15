export interface Waypoint {
  id: string;
  sequence: number;
  latitude: number;
  longitude: number;
  altitude: number;
}

export function createWaypoint(
  sequence: number,
  latitude: number,
  longitude: number,
  altitude: number
): Waypoint {
  return {
    id: (Date.now() + generateRandomNumber()).toString(),
    sequence,
    latitude,
    longitude,
    altitude,
  };
}
const min = 1,
  max = 100;
const generateRandomNumber = () => {
  const newRandomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return newRandomNumber;
};
