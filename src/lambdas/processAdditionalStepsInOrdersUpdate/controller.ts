import enviaModel from "./model/enviaModel";
import sharedModel from "./model/sharedModel";
import tccModel from "./model/tccModel";
import constants from "./utils/const";

const handleTccRequest = async ({ _detail, eventProcess }: any) => {
  try {
    console.log("handleTccRequest...");

    if (eventProcess === "CRONJOB-IDNOVEDAD") {
      await tccModel.insertIncidentId();
    } else {
      console.log("Process not found ");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const handleEnviaRequest = async ({ detail, _eventProcess }: any) => {
  try {
    console.log("handleEnviaRequest...");

    const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

    switch (idCarrierStatusUpdate) {
      case constants.EnviaCarrierStatusUpdate.Redireccionando:
        await sharedModel.insertNewTrackingCodeIfFound({
          data: detail,
          config: {
            startWith: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
            length: 12
          }
        });
        break;
      case constants.EnviaCarrierStatusUpdate.SolucionadoEnMalla:
        await enviaModel.updateShipmentUpdate(detail);
        break;
      default:
        console.log("Process not found ");
        break;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const handleSwaypRequest = async ({ detail, _eventProcess }: any) => {
  try {
    console.log("handleSwaypRequest...");

    const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

    if (idCarrierStatusUpdate === 236) {
      const regexConfigToFindNewTrackingCode = {
        startWith: ["1"],
        length: 11
      };
      await sharedModel.insertNewTrackingCodeIfFound({
        data: detail,
        config: regexConfigToFindNewTrackingCode
      });
    } else {
      console.log("Process not found ");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const handleInterRapidisimoRequest = async ({
  _detail,
  _eventProcess
}: any) => {
  try {
    console.log("handleInterRapidisimoRequest...");
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const handleCoordinadoraRequest = async ({ _detail, _eventProcess }: any) => {
  try {
    console.log("handleCoordinadoraRequest...");
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default {
  handleTccRequest,
  handleEnviaRequest,
  handleSwaypRequest,
  handleInterRapidisimoRequest,
  handleCoordinadoraRequest
};
