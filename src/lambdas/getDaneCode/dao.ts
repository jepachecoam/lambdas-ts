import { daneData } from "./colombiaDaneCodes";
import { DepartmentData } from "./types";

class Dao {
  getDaneData(): DepartmentData[] {
    return daneData as DepartmentData[];
  }
}

export default Dao;
