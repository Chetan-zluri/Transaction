import axios from "axios";

export const getExchangeRate = async (
  date: string,
  currency: string
): Promise<number> => {
  try {
    const response = await axios.get(
      `https://freeexchange.onrender.com/${date}/${currency}`
    );
    if (response.data && response.data.rate) {
      return response.data.rate;
    }
    throw new Error("Exchange rate not found");
  } catch (error) {
    console.error(
      `Error fetching exchange rate for ${currency} on ${date}:`,
      error
    );
    throw new Error("Failed to fetch exchange rate");
  }
};
