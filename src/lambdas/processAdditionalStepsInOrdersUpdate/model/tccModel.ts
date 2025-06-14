import axios from "axios";
import { format, subMonths } from "date-fns";

import dao from "../dao/tccDao";
import dto from "../dto/tccDto";

const getOrdersWithIncidentsTCC = async (remesas: string[]) => {
  try {
    const URL_API =
      "https://somos.tcc.com.co/api/novedades/v2/consultarnovedades";

    const accesstoken = process.env["ACCESS_TOKEN_TCC"];

    const currentDate = new Date();
    const formattedCurrentDate = format(currentDate, "yyyy-MM-dd");

    const initialDate = subMonths(currentDate, 1);
    const formattedInitialDate = format(initialDate, "yyyy-MM-01");

    const body = {
      identificacion: "901320851",
      fechainicial: formattedInitialDate,
      fechafinal: formattedCurrentDate,
      estadosnovedad: ["1", "2", "3", "4", "5", "6"],
      remesas: remesas,
      cuentas: ["1164100", "1164101", "5872600", "5872601", "-1", "-2"],
      unidadesnegocio: ["1", "2"],
      tiposgestion: ["1", "2"],
      fuente: "PWP"
    };
    const headers = {
      accesstoken: accesstoken
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
    if (!ordersIncidentsMs) {
      console.log("Not found ordersIncidentsMs");
      return null;
    }

    const remesas = ordersIncidentsMs.map(
      (order: any) => order.carrierTrackingCode
    );
    const ordersIncidentsTcc = await getOrdersWithIncidentsTCC(remesas);
    const dataToInsert = dto.findMatches({
      ordersIncidentsMs,
      ordersIncidentsTcc
    });
    if (!dataToInsert) {
      console.log("Not found dataToInsert");
      return null;
    }
    return await dao.updateCarrierData({ dataToInsert });
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default { insertIncidentId };
