const SCRIPT = `
(function () {
  try {
    var ua = (navigator && navigator.userAgent) || "";
    var uaPlatform =
      (navigator && navigator.userAgentData && navigator.userAgentData.platform) || "";
    var isWindows = /Windows/i.test(uaPlatform) || /Windows/i.test(ua);
    if (!isWindows) return;

    var root = document.documentElement;
    var pending = false;

    function getBody() {
      return document.body;
    }

    function apply() {
      pending = false;
      var dpr = window.devicePixelRatio || 1;
      var body = getBody();
      root.style.setProperty("--app-dpr", String(dpr));
      if (!body) return;
      if (dpr > 1) {
        body.style.zoom = String(1 / dpr);
      } else {
        body.style.zoom = "";
      }
    }

    function schedule() {
      if (pending) return;
      pending = true;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(apply);
      } else {
        setTimeout(apply, 0);
      }
    }

    function start() {
      apply();
      function trackResolutionChange() {
        var dpr = window.devicePixelRatio || 1;
        var mql = window.matchMedia("(resolution: " + dpr + "dppx)");
        var handler = function () {
          if (mql.removeEventListener) {
            mql.removeEventListener("change", handler);
          } else if (mql.removeListener) {
            mql.removeListener(handler);
          }
          schedule();
          trackResolutionChange();
        };
        if (mql.addEventListener) {
          mql.addEventListener("change", handler);
        } else if (mql.addListener) {
          mql.addListener(handler);
        }
      }
      trackResolutionChange();
      window.addEventListener("resize", schedule, { passive: true });
    }

    if (getBody()) {
      start();
    } else if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    }
  } catch (e) {
    // Silently ignore: scaling compensation is best-effort.
  }
})();
`;

export function WindowsScaleCompensator() {
  return (
    <script
      data-windows-scale-compensator=""
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
