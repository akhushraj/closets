// Every closet module exports INFO, DEFAULTS, CONTROLS and build(params).
import * as master from "./master.js";
import * as rohan from "./rohan.js";
import * as maya from "./maya.js";
import * as guest from "./guest.js";
import * as office from "./office.js";
import * as laundry from "./laundry.js";
import * as pantry from "./pantry.js";
import * as masterbath from "./masterbath.js";

export const CLOSETS = [master, rohan, maya, guest, office, laundry, pantry, masterbath];
export const byId = id => CLOSETS.find(c => c.INFO.id === id) || CLOSETS[0];
