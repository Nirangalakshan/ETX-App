import { ipcMain as p, app as m, BrowserWindow as E } from "electron";
import { createRequire as T } from "node:module";
import { fileURLToPath as V } from "node:url";
import a from "node:path";
const u = a.dirname(V(import.meta.url)), I = T(import.meta.url), { SerialPort: C } = I("serialport");
p.handle("list-ports", async () => {
  try {
    const r = await C.list();
    return console.log(
      "Ports found:",
      r.map((t) => t.path)
    ), r.map((t) => t.path);
  } catch (r) {
    return console.error("Error listing ports:", r), [];
  }
});
const L = (r) => {
  let t = 65535;
  const i = 40961;
  for (const c of r) {
    t ^= c;
    for (let l = 0; l < 8; l++) {
      const n = t & 1;
      t >>= 1, n && (t ^= i);
    }
  }
  return t;
};
let s = null;
p.handle(
  "open-port",
  async (r, t, i = 9600) => new Promise((c, l) => {
    if (s && s.isOpen)
      return c({
        success: !1,
        error: "Another port is already open"
      });
    s = new C({
      path: t,
      baudRate: i,
      autoOpen: !1
    });
    let n = [];
    s.open((w) => {
      if (w)
        return console.error("Error opening port:", w), s = null, l({ success: !1, error: w.message });
      console.log(`Serial port ${t} opened at baud rate ${i}`), c({ success: !0 }), s.on("data", (f) => {
        const v = Array.from(f);
        for (n = [...n, ...v]; n.length >= 8; ) {
          const o = n.slice(0, 8);
          if (n = n.slice(8), o[0] !== 7) {
            console.warn("Invalid frame start:", o), e && !e.isDestroyed() && e.webContents.send("serial-error", `Invalid frame start: ${o}`);
            continue;
          }
          const _ = o[7] << 8 | o[6], P = L(o.slice(0, 6));
          if (_ !== P) {
            console.warn("CRC mismatch:", o), e && !e.isDestroyed() && e.webContents.send("serial-error", `CRC mismatch: ${o}`);
            continue;
          }
          const R = o.map((d) => d.toString(16).padStart(2, "0")).join(" ").toUpperCase(), D = o.map((d) => d.toString(10).padStart(3, "0")).join(" ");
          console.log("Serial HEX data received:", R), console.log("Serial DECIMAL data received:", D);
          let g;
          o[0] === 7 && (o[2] === 166 || o[2] === 167) && (g = ((o[4] << 8 | o[5]) / 1e4).toFixed(3), console.log(`Voltage: ${g} V`));
          let y;
          o[0] === 7 && o[2] === 165 && (y = ((o[4] << 8 | o[5]) / 100).toFixed(1), console.log(`Temperature: ${y} °C`)), e && !e.isDestroyed() && e.webContents.send("serial-data", {
            hex: R,
            parsed: g
          });
        }
      }), s.on("error", (f) => {
        console.error("Serial port error:", f), e && !e.isDestroyed() && e.webContents.send("serial-error", f.message);
      }), s.on("close", () => {
        console.log("Serial port closed"), s = null, n = [], e && !e.isDestroyed() && e.webContents.send("serial-closed");
      });
    });
  })
);
p.handle("write-port-raw", async (r, t) => new Promise((i, c) => {
  if (!s || !s.isOpen)
    return i({ success: !1, error: "No port is open" });
  const l = Buffer.from(t);
  s.write(l, (n) => {
    if (n)
      return console.error("Error writing raw data to port:", n), c({ success: !1, error: n.message });
    console.log("Raw data written to port:", l), i({ success: !0 });
  });
}));
p.handle("close-port", async () => {
  try {
    s && s.isOpen ? (await s.close(), s = null, console.log("Main: Port closed successfully")) : console.log("Main: No open port to close");
  } catch (r) {
    throw console.error("Main: Error closing port:", r), r;
  }
});
process.env.APP_ROOT = u;
const h = process.env.VITE_DEV_SERVER_URL, U = a.join(process.env.APP_ROOT, "dist-electron"), S = a.join(u, "../dist");
process.env.VITE_PUBLIC = h ? a.join(process.env.APP_ROOT, "public") : S;
let e;
function b() {
  if (e = new E({
    width: 1920,
    height: 1080,
    resizable: !1,
    center: !0,
    frame: !1,
    autoHideMenuBar: !0,
    icon: a.join(u, "public/icon.ico"),
    webPreferences: {
      preload: a.join(u, "preload.mjs")
    }
  }), e.webContents.openDevTools(), e.webContents.on("did-finish-load", () => {
    e && !e.isDestroyed() && e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), h)
    e.loadURL(h);
  else {
    const r = a.join(S, "index.html");
    console.log("Loading file:", r), e.loadFile(r), e.setTitle("Electron Vite App");
  }
  p.on("minimize-window", () => {
    e == null || e.minimize();
  }), p.on("close-window", () => {
    e == null || e.close();
  });
}
m.on("window-all-closed", () => {
  process.platform !== "darwin" && (m.quit(), e = null);
});
m.on("activate", () => {
  E.getAllWindows().length === 0 && b();
});
m.whenReady().then(async () => {
  b();
  try {
    const r = await C.list();
    console.log(
      "Startup ports:",
      r.map((t) => t.path)
    );
  } catch (r) {
    console.error("Error listing ports at startup:", r);
  }
});
export {
  U as MAIN_DIST,
  S as RENDERER_DIST,
  h as VITE_DEV_SERVER_URL
};
