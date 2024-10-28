export function multiplyFractions(fraction1, fraction2) {
    // Function to parse a fraction string and return numerator and denominator
    function parseFraction(fraction) {
      const [numerator, denominator] = fraction.split("/").map(Number);
      return { numerator, denominator };
    }

    // Function to simplify a fraction
    function simplifyFraction(numerator, denominator) {
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(numerator, denominator);
      return {
        numerator: numerator / divisor,
        denominator: denominator / divisor,
      };
    }

    // Parse both fractions
    const { numerator: num1, denominator: denom1 } =
      parseFraction(fraction1);
    const { numerator: num2, denominator: denom2 } =
      parseFraction(fraction2);

    // Multiply the fractions
    const resultNumerator = num1 * num2;
    const resultDenominator = denom1 * denom2;

    // Simplify the result
    const { numerator: simplifiedNum, denominator: simplifiedDenom } =
      simplifyFraction(resultNumerator, resultDenominator);

    return `${simplifiedNum}/${simplifiedDenom}`;
  }