require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const port = process.env.APP_PORT || 3000;
const bankIndonesiaUrl =
  "https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx";
const kemenkeuUrl = "https://fiskal.kemenkeu.go.id/informasi-publik/kurs-pajak";

app.get("/", (req, res) => {
  res.redirect("/exchange-rates");
});

app.get("/exchange-rates", async (req, res) => {
  try {
    const response = await axios.get(bankIndonesiaUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Find the table with class 'table1'
    const table = $("table.table.table-striped.table-no-bordered.table-lg");

    // Check if the table exists
    if (table.length) {
      const rates = [];

      const rows = table.find("tr");
      rows.each((index, row) => {
        const columns = $(row).find("td");
        const rowData = [];
        columns.each((index, column) => {
          rowData.push($(column).text().trim());
        });

        if (rowData.length > 0) {
          const data = {
            mataUang: rowData[0],
            nilai: rowData[1],
            kursJual: strToBD(rowData[2]),
            kursBeli: strToBD(rowData[3]),
          };
          rates.push(data);
        }
      });

      res.json(rates);
    } else {
      res.status(404).send("No exchange rates table found.");
    }
  } catch (error) {
    res
      .status(500)
      .send("Error fetching the webpage content: " + error.message);
  }
});

app.get("/kurs-pajak", async (req, res) => {
  try {
    const response = await axios.get(kemenkeuUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Find the table with class 'table1'
    const table = $("table.table-bordered.table-striped");

    // Check if the table exists
    if (table.length) {
      const rates = [];

      const rows = table.find("tr");
      rows.each((index, row) => {
        if (index > 0) {
          const columns = $(row).find("td");
          const rowData = [];
          columns.each((index, column) => {
            rowData.push($(column).text().trim());
          });

          let nilaiRupiah = 1;
          if (rowData.length > 0) {
            if (rowData[1].slice(-3) == "JPY") {
              nilaiRupiah = 100;
            }
            const data = {
              isoCode: rowData[1].slice(-3),
              mataUang: rowData[1].split("\n")[0].trim(),
              nilaiRupiah: nilaiRupiah,
              nilaiUang: strToBD(rowData[2]),
              perubahan: strToBD(rowData[3]),
            };
            rates.push(data);
          }
        }
      });

      res.json(rates);
    } else {
      res.status(404).send("No exchange rates table found.");
    }
  } catch (error) {
    res
      .status(500)
      .send("Error fetching the webpage content: " + error.message);
  }
});

const strToBD = (originalString) => {
  let withoutThousandsSeparator = originalString.replace(/\./g, "");
  let normalizedString = withoutThousandsSeparator.replace(",", ".");
  let decimalNumber = parseFloat(normalizedString);

  return decimalNumber;
};

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
