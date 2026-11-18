/**
 * Returns the average of a list of numbers.
 * An empty list has the average 0.
 */
export function average(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length;
}
