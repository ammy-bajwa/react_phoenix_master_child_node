import { createStore } from "redux";
import { tableReducer } from "./rootReducer";

export const store = createStore(tableReducer);
