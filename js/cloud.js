(function (root) {
  "use strict";

  const REQUIRED_FIELDS = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
  const state = {
    status: "disabled",
    detail: "Cloud leaderboard is not configured.",
    database: null,
    initPromise: null,
    loadedSdk: false
  };

  function getConfig() {
    return root.CRYPTOGUESS_FIREBASE || null;
  }

  function isConfigured() {
    const config = getConfig();
    if (!config || config.enabled !== true) {
      return false;
    }
    return REQUIRED_FIELDS.every(function (field) {
      return typeof config[field] === "string" && config[field].trim().length > 0;
    });
  }

  function setStatus(status, detail) {
    state.status = status;
    state.detail = detail;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", function () {
          reject(new Error("Unable to load cloud SDK."));
        }, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.addEventListener("load", function () {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", function () {
        reject(new Error("Unable to load cloud SDK."));
      }, { once: true });
      document.head.appendChild(script);
    });
  }

  async function loadSdk(version) {
    if (state.loadedSdk) {
      return;
    }
    const base = "https://www.gstatic.com/firebasejs/" + version + "/";
    await loadScript(base + "firebase-app-compat.js");
    await loadScript(base + "firebase-database-compat.js");
    if (getConfig().requireAnonymousAuth !== false) {
      await loadScript(base + "firebase-auth-compat.js");
    }
    state.loadedSdk = true;
  }

  async function init() {
    if (state.initPromise) {
      return state.initPromise;
    }

    const config = getConfig();
    if (!config || config.enabled !== true) {
      setStatus("disabled", "Cloud leaderboard is not configured.");
      return false;
    }
    if (!isConfigured()) {
      setStatus("error", "Cloud configuration is incomplete. Check js/firebase-config.js.");
      return false;
    }

    setStatus("connecting", "Connecting to the cloud archive...");
    state.initPromise = (async function () {
      try {
        await loadSdk(config.sdkVersion || "10.12.5");
        if (!root.firebase || !root.firebase.initializeApp) {
          throw new Error("Firebase SDK did not initialise.");
        }

        const app = root.firebase.apps && root.firebase.apps.length
          ? root.firebase.app()
          : root.firebase.initializeApp({
              apiKey: config.apiKey,
              authDomain: config.authDomain,
              databaseURL: config.databaseURL,
              projectId: config.projectId,
              appId: config.appId
            });

        if (config.requireAnonymousAuth !== false) {
          if (!root.firebase.auth) {
            throw new Error("Anonymous authentication is unavailable.");
          }
          const credential = await root.firebase.auth().signInAnonymously();
          if (!credential || !credential.user) {
            throw new Error("Anonymous sign-in failed.");
          }
        }

        state.database = root.firebase.database(app);
        setStatus("online", "Cloud archive connected.");
        return true;
      } catch (error) {
        state.database = null;
        setStatus("error", "Cloud archive unavailable. Local scores remain active.");
        return false;
      }
    })();

    return state.initPromise;
  }

  function cleanEntry(entry) {
    return {
      name: String(entry.name || "OPERATIVE").slice(0, 16),
      score: Math.max(0, Math.min(99999, Math.floor(Number(entry.score) || 0))),
      difficulty: ["easy", "medium", "hard", "expert", "daily"].includes(entry.difficulty)
        ? entry.difficulty
        : "easy",
      time: Math.max(0, Math.min(3600, Math.floor(Number(entry.time) || 0))),
      attempts: Math.max(1, Math.min(20, Math.floor(Number(entry.attempts) || 1))),
      createdAt: Math.max(0, Math.floor(Number(entry.createdAt) || Date.now())),
      dailyDate: entry.dailyDate ? String(entry.dailyDate).slice(0, 10) : null
    };
  }

  async function submit(entry) {
    if (state.status !== "online" || !state.database) {
      return null;
    }
    try {
      const payload = cleanEntry(entry);
      const reference = state.database.ref("leaderboard").push();
      await reference.set(payload);
      return reference.key;
    } catch (error) {
      setStatus("error", "Cloud submission failed. Local scores remain active.");
      return null;
    }
  }

  async function fetchTop(limit) {
    if (state.status !== "online" || !state.database) {
      return [];
    }
    try {
      const safeLimit = Math.max(10, Math.min(300, Math.floor(Number(limit) || 100)));
      const snapshot = await state.database
        .ref("leaderboard")
        .orderByChild("score")
        .limitToLast(safeLimit)
        .once("value");

      const entries = [];
      snapshot.forEach(function (child) {
        const value = child.val() || {};
        entries.push({
          id: child.key,
          name: String(value.name || "OPERATIVE").slice(0, 16),
          score: Math.max(0, Number(value.score) || 0),
          difficulty: String(value.difficulty || "easy"),
          time: Math.max(0, Number(value.time) || 0),
          attempts: Math.max(1, Number(value.attempts) || 1),
          createdAt: Math.max(0, Number(value.createdAt) || 0),
          dailyDate: value.dailyDate || null,
          source: "cloud"
        });
      });
      return entries.reverse();
    } catch (error) {
      setStatus("error", "Cloud rankings could not be loaded. Local scores remain active.");
      return [];
    }
  }

  function getStatus() {
    return {
      state: state.status,
      detail: state.detail,
      configured: isConfigured(),
      enabled: Boolean(getConfig() && getConfig().enabled === true)
    };
  }

  root.CryptoGuessCloud = {
    init: init,
    submit: submit,
    fetchTop: fetchTop,
    getStatus: getStatus
  };
})(typeof window !== "undefined" ? window : globalThis);
