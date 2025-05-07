import axios from "axios";
import { format, subMonths } from "date-fns";

import dao from "../dao/tccDao";
import dto from "../dto/tccDto";

const getOrdersWithIncidentsTCC = async () => {
  try {
    const URL_API =
      "https://tccrestify-dot-tcc-cloud.appspot.com/novedades/v2/consultarnovedades";

    const currentDate = new Date();
    const formattedCurrentDate = format(currentDate, "yyyy-MM-dd");

    const initialDate = subMonths(currentDate, 1);
    const formattedInitialDate = format(initialDate, "yyyy-MM-01");

    const body = {
      identificacion: "901320851",
      fechainicial: formattedInitialDate,
      fechafinal: formattedCurrentDate,
      estadosnovedad: [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ],
      remesas: [],
      cuentas: [],
      unidadesnegocio: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      tiposgestion: ["1", "2"],
      fuente: "PWP"
    };
    const headers = {
      authority: "tccrestify-dot-tcc-cloud.appspot.com",
      accept: "application/json, text/plain, */*",
      "accept-language": "es-ES,es;q=0.7",
      accesstoken: "TCCNTSEESUHRMHRG0TPM",
      accesstokenenc:
        "356432476A5848342F456D6452732B51494248584E31364F6E4452524262686E376F5133706349684B6D5769774B5547634C534730413D3D",
      appid: "0e5cf9f1f46bea0eeb523e966fe1b795198feda1a11ca18b9746f3cf4b181156",
      "content-type": "application/json;charset=UTF-8",
      origin: "https://app.tcc.com.co",
      referer: "https://app.tcc.com.co/",
      "sec-ch-ua": '"Brave";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    };
    const response = await axios.post(URL_API, body, { headers });

    const incidents = response.data?.novedades ?? [];
    return incidents.length > 0 ? incidents : null;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const insertIncidentId = async () => {
  try {
    const ordersIncidentsMs = await dao.getOrdersWithIncidentsTccMs();
    const ordersIncidentsTcc = await getOrdersWithIncidentsTCC();
    const dataToInsert = dto.findMatches({
      ordersIncidentsMs,
      ordersIncidentsTcc
    });
    if (!dataToInsert) {
      console.log("No data to update");
      return null;
    }
    return await dao.updateCarrierData({ dataToInsert });
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default { insertIncidentId };
