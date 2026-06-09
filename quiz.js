/* nodeadline — quiz → mini-map (TZ §6).
   Vanilla. No build. Loads quiz.json + rules.json, runs a showIf state machine
   (mouse/tap only, no contact asked before the result), generates a map with a
   declarative rules engine, and renders it with Cytoscape.js (lazy-loaded). */
(function () {
  "use strict";

  var MOUNT = document.getElementById("quiz-mount");
  var EXAMPLE = document.getElementById("cy-example");
  if (!MOUNT && !EXAMPLE) return;

  var CYTO_URL = "https://unpkg.com/cytoscape@3.30.2/dist/cytoscape.min.js";
  var STORE_KEY = "ndl_quiz_v1";
  var START_HREF =
    "mailto:nikolai@riabets.com?subject=Nodeadline%20%E2%80%94%20Send%20me%20my%20real%20map";

  // node type → colour (matches the home.css syntax palette)
  var TYPE_COLOR = {
    people: "#0550ae", materials: "#1b7c83", tools: "#bc4c00",
    money: "#1a7f37", documents: "#8250df", external: "#cf222e"
  };
  var TYPE_LABEL = {
    people: "people", materials: "materials", tools: "tools",
    money: "money", documents: "documents", external: "external"
  };

  // ---------- helpers ----------
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function asArray(x) { return Array.isArray(x) ? x : x == null ? [] : [x]; }
  function loadJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  // ---------- lazy Cytoscape ----------
  var cytoPromise = null;
  function ensureCytoscape() {
    if (window.cytoscape) return Promise.resolve(window.cytoscape);
    if (cytoPromise) return cytoPromise;
    cytoPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = CYTO_URL;
      s.async = true;
      s.onload = function () { window.cytoscape ? resolve(window.cytoscape) : reject(new Error("no cytoscape")); };
      s.onerror = function () { reject(new Error("cytoscape load failed")); };
      document.head.appendChild(s);
    });
    return cytoPromise;
  }

  // ---------- rules engine ----------
  function answerMatches(answers, key, val) {
    var a = answers[key];
    if (a == null) return false;
    return Array.isArray(a) ? a.indexOf(val) !== -1 : a === val;
  }
  function firstExisting(nodeMap, ids) {
    for (var i = 0; i < ids.length; i++) if (nodeMap[ids[i]]) return ids[i];
    return null;
  }
  function buildMap(answers, rules) {
    var sk = rules.skeletons[answers.biz_type] || rules.skeletons._generic;
    var nodes = sk.nodes.map(function (n) {
      return Object.assign({}, n, { functions: (n.functions || []).slice() });
    });
    var edges = sk.edges.map(function (e) { return Object.assign({}, e); });
    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    function addEdge(spec) {
      var from = spec.from, to = spec.to;
      if (spec.from_hub) from = firstExisting(nodeMap, spec.from_hub);
      if (spec.to_hub) to = firstExisting(nodeMap, spec.to_hub);
      if (!from || !to || !nodeMap[from] || !nodeMap[to]) return;
      edges.push({ source: from, target: to, kind: spec.kind || "flow", label: spec.label || "" });
    }

    (rules.rules || []).forEach(function (rule) {
      var whenKey = Object.keys(rule.when)[0];
      if (!answerMatches(answers, whenKey, rule.when[whenKey])) return;
      if (rule.addNode && !nodeMap[rule.addNode.id]) {
        var nn = Object.assign({}, rule.addNode, { functions: (rule.addNode.functions || []).slice() });
        nodes.push(nn); nodeMap[nn.id] = nn;
      }
      if (rule.addEdges) rule.addEdges.forEach(addEdge);
      if (rule.highlightNode) {
        var hid = firstExisting(nodeMap, asArray(rule.highlightNode));
        if (hid) nodeMap[hid].highlight = true;
      }
      if (rule.hint) {
        var tid = firstExisting(nodeMap, asArray(rule.hint.node));
        if (tid) {
          nodeMap[tid].hint = { type: rule.hint.type, text: rule.hint.text };
          nodeMap[tid].highlight = true;
        }
      }
    });

    if (!nodes.some(function (n) { return n.highlight; })) {
      var dh = nodeMap[rules.defaultHighlight] || nodes[0];
      if (dh) dh.highlight = true;
    }
    if (nodes.length > 15) nodes = nodes.slice(0, 15);
    edges.forEach(function (e, i) { e.id = "e" + i; });
    return { nodes: nodes, edges: edges };
  }

  // ---------- Cytoscape render ----------
  function toElements(map) {
    var els = [], present = {};
    map.nodes.forEach(function (n) { present[n.id] = true; });
    map.nodes.forEach(function (n) {
      els.push({ data: { id: n.id, label: n.label, type: n.type, hl: n.highlight ? 1 : 0,
        functions: n.functions || [], hint: n.hint || null } });
    });
    map.edges.forEach(function (e) {
      if (!present[e.source] || !present[e.target]) return;
      els.push({ data: { id: e.id, source: e.source, target: e.target,
        label: e.label || "", kind: e.kind, hl: e.highlight ? 1 : 0 } });
    });
    return els;
  }
  function cyStyle() {
    return [
      { selector: "node", style: {
        "background-color": function (e) { return TYPE_COLOR[e.data("type")] || "#0a0a0a"; },
        "label": "data(label)", "color": "#0a0a0a", "font-family": "JetBrains Mono, monospace",
        "font-size": 10, "text-valign": "bottom", "text-margin-y": 5, "width": 15, "height": 15,
        "text-wrap": "wrap", "text-max-width": 78,
        "text-background-color": "#ffffff", "text-background-opacity": 0.82,
        "text-background-padding": 2, "text-background-shape": "roundrectangle" } },
      { selector: "node[hl = 1]", style: {
        "width": 22, "height": 22, "border-width": 3, "border-color": "#0a0a0a", "font-weight": "bold" } },
      { selector: "node:selected", style: { "border-width": 3, "border-color": "#0550ae" } },
      { selector: "edge", style: {
        "width": 1.4, "line-color": "#c8c8c8", "target-arrow-color": "#c8c8c8",
        "target-arrow-shape": "triangle", "curve-style": "bezier", "arrow-scale": 0.8,
        "label": "data(label)", "font-family": "JetBrains Mono, monospace", "font-size": 8,
        "color": "#9a9a9a", "text-rotation": "autorotate", "text-background-color": "#fff",
        "text-background-opacity": 1, "text-background-padding": 1.5 } },
      { selector: "edge[kind = 'transaction']", style: {
        "line-style": "dashed", "line-color": "#bc4c00", "target-arrow-color": "#bc4c00" } },
      { selector: "edge[hl = 1]", style: {
        "width": 2.6, "line-color": "#cf222e", "target-arrow-color": "#cf222e" } }
    ];
  }
  function renderMap(container, map, onNode) {
    return ensureCytoscape().then(function (cytoscape) {
      container.innerHTML = "";
      var cy = cytoscape({
        container: container, elements: toElements(map), style: cyStyle(),
        layout: { name: "cose", animate: false, padding: 30, nodeRepulsion: 16000,
          idealEdgeLength: 120, nodeOverlap: 28, componentSpacing: 130, gravity: 0.2, randomize: true },
        minZoom: 0.4, maxZoom: 2.5, autoungrabify: false
      });
      cy.fit(undefined, 28);
      if (onNode) cy.on("tap", "node", function (evt) { onNode(evt.target.data(), map); });
      return cy;
    }).catch(function () {
      container.innerHTML =
        '<p class="cy-fallback">Map preview needs a moment / a connection. ' +
        "Your answers are saved — we'll draw the real version with you.</p>";
    });
  }

  // ---------- example map (café) in the #example section ----------
  function mountExample(rules) {
    if (!EXAMPLE || !rules.examples || !rules.examples.cafe) return;
    var ex = rules.examples.cafe;
    var map = { nodes: ex.nodes.map(function (n) {
        return Object.assign({}, n, { highlight: n.id === ex.highlightNode });
      }), edges: ex.edges.slice() };
    var done = false;
    function go() {
      if (done) return; done = true;
      renderMap(EXAMPLE, map, function (d) { sidePanel(document.getElementById("ex-side"), d, map); });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { go(); io.disconnect(); } });
      }, { rootMargin: "200px" });
      io.observe(EXAMPLE);
    } else { go(); }
  }

  // ---------- node side-panel ----------
  function sidePanel(host, d, map) {
    if (!host) return;
    var incoming = map.edges.filter(function (e) { return e.target === d.id; });
    var outgoing = map.edges.filter(function (e) { return e.source === d.id; });
    var byId = {};
    map.nodes.forEach(function (n) { byId[n.id] = n.label; });
    var html = '<span class="sp-type" style="color:' + (TYPE_COLOR[d.type] || "#0a0a0a") + '">' +
      esc(TYPE_LABEL[d.type] || d.type) + "</span>";
    html += "<h4>" + esc(d.label) + "</h4>";
    if (d.functions && d.functions.length) {
      html += "<ul class='sp-fn'>" + d.functions.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>";
    }
    function lines(list, dir) {
      return list.map(function (e) {
        var other = dir === "in" ? byId[e.source] : byId[e.target];
        return "<li>" + (dir === "in" ? "← " : "→ ") + esc(other || "") +
          (e.label ? ' <span class="sp-lbl">' + esc(e.label) + "</span>" : "") + "</li>";
      }).join("");
    }
    if (incoming.length) html += "<p class='sp-h'>in</p><ul class='sp-edges'>" + lines(incoming, "in") + "</ul>";
    if (outgoing.length) html += "<p class='sp-h'>out</p><ul class='sp-edges'>" + lines(outgoing, "out") + "</ul>";
    if (d.hint && d.hint.text) {
      html += '<p class="sp-hint"><span class="sp-hint-tag">' + esc(d.hint.type) + "</span>" + esc(d.hint.text) + "</p>";
    }
    host.innerHTML = html;
    host.hidden = false;
  }

  // ---------- quiz controller ----------
  function startQuiz(quiz, rules) {
    if (!MOUNT) return;
    var questions = quiz.questions;
    var answers = {};
    try { answers = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { answers = {}; }
    var idx = 0;

    function visible() {
      return questions.filter(function (q) {
        if (!q.showIf) return true;
        return Object.keys(q.showIf).every(function (k) {
          return q.showIf[k].indexOf(answers[k]) !== -1;
        });
      });
    }
    function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(answers)); } catch (e) {} }
    function firstUnanswered(list) {
      for (var i = 0; i < list.length; i++) if (answers[list[i].id] == null) return i;
      return list.length;
    }

    function render() {
      var list = visible();
      if (idx >= list.length) return complete();
      var q = list[idx];
      MOUNT.classList.add("quiz-live");
      MOUNT.innerHTML = "";

      var head = el("div", "quiz-head");
      head.appendChild(el("span", "quiz-step", "step " + (idx + 1) + " / " + list.length));
      var bar = el("div", "quiz-bar");
      var fill = el("span", "quiz-bar-fill");
      fill.style.width = Math.round(((idx) / list.length) * 100) + "%";
      bar.appendChild(fill);
      head.appendChild(bar);
      MOUNT.appendChild(head);

      MOUNT.appendChild(el("h3", "quiz-q", esc(q.title)));
      if (q.subtitle) MOUNT.appendChild(el("p", "quiz-sub", esc(q.subtitle)));

      var opts = el("div", "quiz-opts");
      var selected = q.type === "multi" ? asArray(answers[q.id]).slice() : answers[q.id];

      q.options.forEach(function (o) {
        var b = el("button", "quiz-opt", esc(o.label));
        b.type = "button";
        var on = q.type === "multi" ? selected.indexOf(o.value) !== -1 : selected === o.value;
        if (on) b.classList.add("on");
        b.addEventListener("click", function () {
          if (q.type === "multi") {
            var i = selected.indexOf(o.value);
            if (i === -1) selected.push(o.value); else selected.splice(i, 1);
            answers[q.id] = selected.slice();
            save();
            b.classList.toggle("on");
          } else {
            answers[q.id] = o.value;
            save();
            idx += 1;
            render();
          }
        });
        opts.appendChild(b);
      });
      MOUNT.appendChild(opts);

      var nav = el("div", "quiz-nav");
      if (idx > 0) {
        var back = el("button", "quiz-back", "← back");
        back.type = "button";
        back.addEventListener("click", function () { idx -= 1; render(); });
        nav.appendChild(back);
      }
      if (q.type === "multi") {
        var next = el("button", "btn primary quiz-next", "Next →");
        next.type = "button";
        next.addEventListener("click", function () { idx += 1; render(); });
        nav.appendChild(next);
      }
      MOUNT.appendChild(nav);
    }

    function complete() {
      save();
      var map = buildMap(answers, rules);
      var bizLabel = (function () {
        var q0 = questions[0];
        var o = q0.options.filter(function (x) { return x.value === answers.biz_type; })[0];
        return o ? o.label : "your business";
      })();

      MOUNT.classList.add("quiz-live", "quiz-result");
      MOUNT.innerHTML = "";
      MOUNT.appendChild(el("p", "quiz-done-tag", "// your business, on one page"));

      var stage = el("div", "quiz-stage");
      var cy = el("div", "cy-canvas");
      cy.id = "quiz-cy";
      var side = el("aside", "cy-side");
      side.id = "quiz-side";
      side.hidden = true;
      stage.appendChild(cy);
      stage.appendChild(side);
      MOUNT.appendChild(stage);

      MOUNT.appendChild(el("p", "cy-tip", "Tap any node to see what it does and where it hands off. Solid = flow · dashed = where money changes hands."));

      // surfaced highlight hint, if any
      var hinted = map.nodes.filter(function (n) { return n.hint && n.hint.text; })[0];
      if (hinted) {
        MOUNT.appendChild(el("p", "cy-win",
          '<span class="cy-win-tag">where we\'d look first</span>' + esc(hinted.hint.text)));
      }

      MOUNT.appendChild(el("p", "example-disclaimer",
        "This is a generic template for a <span class='tk-ty'>" + esc(bizLabel) +
        "</span>. Your real business looks different — <strong>that's the whole point.</strong>"));

      var actions = el("div", "cta-row quiz-actions");
      var start = el("a", "btn primary", "Send me my real map");
      start.href = START_HREF;
      actions.appendChild(start);
      var redo = el("button", "btn ghost", "Start over");
      redo.type = "button";
      redo.addEventListener("click", function () {
        answers = {}; idx = 0;
        try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        MOUNT.classList.remove("quiz-result");
        render();
      });
      actions.appendChild(redo);
      MOUNT.appendChild(actions);

      renderMap(cy, map, function (d) { sidePanel(side, d, map); });
    }

    // resume to the first unanswered visible question (or the result if complete)
    var list0 = visible();
    idx = answers.biz_type != null ? firstUnanswered(list0) : 0;
    render();
  }

  // ---------- boot ----------
  Promise.all([loadJSON("quiz.json?v=1"), loadJSON("rules.json?v=1")])
    .then(function (res) {
      var quiz = res[0], rules = res[1];
      startQuiz(quiz, rules);
      mountExample(rules);
    })
    .catch(function () {
      /* leave the static placeholder / fallback in place on failure */
    });
})();
