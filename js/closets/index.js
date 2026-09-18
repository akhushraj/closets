// Every closet module exports INFO, DEFAULTS, CONTROLS and build(params).
import * as rohan from "./rohan.js";
import * as master from "./master.js";
import * as office from "./office.js";

export const CLOSETS = [master, rohan, office];
export const byId = id => CLOSETS.find(c => c.INFO.id === id) || CLOSETS[0];
