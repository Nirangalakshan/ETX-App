import { app as n, BrowserWindow as i } from "electron";
import o from "path";
let e = null;
const t = () => {
  e = new i({
    width: 1e3,
    height: 800,
    webPreferences: {
      preload: o.join(__dirname, "preload.js")
    }
  }), process.env.NODE_ENV === "development" ? e.loadURL("http://localhost:5173") : e.loadFile(o.join(__dirname, "../dist/index.html"));
};
n.whenReady().then(t);
