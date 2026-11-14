/*
 * 문제풀이 엔진
 * - 데이터: data/chXX.js 가 window.OSQ_DATA 에 {ch, title, items:[...]} 를 push 합니다.
 * - 기록: 브라우저 localStorage 에 문제별로 저장 (고른 답, 정답 여부, ⭐ 중요, 메모, 서술형 답)
 * - 페이지: <body data-sets="1,2,3"> 처럼 이 페이지에서 보여줄 장 번호를 적습니다.
 *
 * 문제 형식 (items 한 개)
 *  { n: 번호, q: "문제", c: ["보기1","보기2","보기3","보기4"], a: 정답번호(1~4),
 *    e: "해설", src: "key"(해답 파일 정답) | "self"(직접 풀이) | "made"(직접 만든 연습문제),
 *    type: "mc" | "essay", model: "서술형 모범 답안", calc: true(계산 문제),
 *    code: "코드 블록", fig: "그림/표 설명(HTML 허용)", note: "주의 메모" }
 */
(function () {
  "use strict";
  var KEY = "osq:v1:";
  var store = {
    get: function (id) {
      try { return JSON.parse(localStorage.getItem(KEY + id)) || {}; } catch (e) { return {}; }
    },
    set: function (id, v) {
      try { localStorage.setItem(KEY + id, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    all: function () {
      var out = {};
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(KEY) === 0) out[k.slice(KEY.length)] = JSON.parse(localStorage.getItem(k));
        }
      } catch (e) {}
      return out;
    }
  };
  window.OSQ_STORE = store;

  var CIRCLED = ["①", "②", "③", "④", "⑤"];
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // 2^10 같은 표기를 위첨자로
  function fmt(s) { return esc(s).replace(/2\^(\d+)/g, "2<sup>$1</sup>"); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var root, statsEl, barEl, listEl, filter = "all", chFilter = "all";
  var items = [];

  function idOf(ch, it) { return ch + "-" + (it.id || it.n); }

  function collect() {
    var want = (document.body.getAttribute("data-sets") || "").split(",").map(function (x) { return +x; });
    var sets = (window.OSQ_DATA || []).filter(function (s) { return want.indexOf(s.ch) >= 0; });
    sets.sort(function (a, b) { return a.ch - b.ch; });
    items = [];
    sets.forEach(function (s) {
      s.items.forEach(function (it) {
        items.push({ ch: s.ch, chTitle: s.title, it: it, id: idOf(s.ch, it) });
      });
    });
    // 계산 문제는 맨 뒤로 (장 순서 → 번호 순서 유지)
    var normal = items.filter(function (x) { return !x.it.calc; });
    var calc = items.filter(function (x) { return x.it.calc; });
    items = normal.concat(calc);
    return sets;
  }

  function status(x) {
    var r = store.get(x.id);
    return r;
  }

  function matches(x) {
    if (chFilter !== "all" && x.ch !== +chFilter) return false;
    var r = status(x);
    switch (filter) {
      case "todo": return r.correct == null;
      case "wrong": return r.correct === false;
      case "star": return !!r.star;
      case "memo": return !!(r.memo && r.memo.trim());
      case "calc": return !!x.it.calc;
      default: return true;
    }
  }

  function updateStats() {
    var total = items.length, done = 0, ok = 0, bad = 0, star = 0;
    items.forEach(function (x) {
      var r = status(x);
      if (r.correct != null) { done++; if (r.correct) ok++; else bad++; }
      if (r.star) star++;
    });
    statsEl.innerHTML =
      "<span>전체 <b>" + total + "</b></span>" +
      "<span>푼 문제 <b>" + done + "</b></span>" +
      "<span>맞힘 <b>" + ok + "</b></span>" +
      "<span>틀림 <b>" + bad + "</b></span>" +
      "<span>⭐ <b>" + star + "</b></span>";
    barEl.style.width = total ? Math.round((done / total) * 100) + "%" : "0";
  }

  function tagsHTML(it) {
    var t = [];
    if (it.type === "essay") t.push('<span class="tag essay">서술형</span>');
    if (it.calc) t.push('<span class="tag calc">계산</span>');
    if (it.src === "key") t.push('<span class="tag key">해답 파일 정답</span>');
    else if (it.src === "self") t.push('<span class="tag self">직접 풀이(해답 없음)</span>');
    else if (it.src === "made") t.push('<span class="tag self">교재 예제로 만든 연습문제</span>');
    if (it.note) t.push('<span class="tag warn">확인 필요</span>');
    return t.join("");
  }

  function renderItem(x) {
    var it = x.it, r = status(x);
    var card = el("article", "q" + (it.calc ? " is-calc" : ""));
    card.id = "q-" + x.id;
    if (r.correct === true) card.classList.add("is-ok");
    if (r.correct === false) card.classList.add("is-bad");

    var head = el("div", "qhead");
    head.appendChild(el("div", "qnum", (chFilterLabel() ? x.ch + "장 " : "") + String(it.n).padStart(2, "0")));
    var body = el("div", "qtext");
    body.appendChild(el("div", "qtags", tagsHTML(it)));
    body.appendChild(el("div", "", fmt(it.q)));
    if (it.fig) body.appendChild(el("div", "fig", it.fig));
    if (it.code) body.appendChild(el("pre", "", esc(it.code)));
    head.appendChild(body);
    var sb = el("button", "starbtn", "★");
    sb.type = "button";
    sb.title = "중요 표시";
    sb.setAttribute("aria-label", "중요 표시");
    sb.setAttribute("aria-pressed", r.star ? "true" : "false");
    sb.onclick = function () {
      var v = store.get(x.id); v.star = !v.star; store.set(x.id, v);
      sb.setAttribute("aria-pressed", v.star ? "true" : "false");
      updateStats();
    };
    head.appendChild(sb);
    card.appendChild(head);

    var resBox = el("div", "");
    if (it.type === "essay") {
      var wrap = el("div", "essay");
      var ta = el("textarea");
      ta.placeholder = "내 답을 먼저 적어 보세요 (자동 저장)";
      ta.value = r.mine || "";
      var t1;
      ta.oninput = function () {
        clearTimeout(t1);
        t1 = setTimeout(function () { var v = store.get(x.id); v.mine = ta.value; store.set(x.id, v); }, 300);
      };
      wrap.appendChild(ta);
      var row = el("div", "row");
      var show = el("button", "btn", r.correct != null ? "모범 답안 숨기기" : "모범 답안 보기");
      show.type = "button";
      var model = el("div", "model", fmt(it.model || ""));
      model.style.display = r.correct != null ? "" : "none";
      var okB = el("button", "btn", "맞게 썼어요");
      var badB = el("button", "btn", "다시 볼래요");
      okB.type = badB.type = "button";
      show.onclick = function () {
        var on = model.style.display === "none";
        model.style.display = on ? "" : "none";
        show.textContent = on ? "모범 답안 숨기기" : "모범 답안 보기";
      };
      function selfMark(v) {
        var s = store.get(x.id); s.correct = v; s.at = Date.now(); store.set(x.id, s);
        card.classList.toggle("is-ok", v); card.classList.toggle("is-bad", !v);
        model.style.display = ""; show.textContent = "모범 답안 숨기기";
        updateStats();
      }
      okB.onclick = function () { selfMark(true); };
      badB.onclick = function () { selfMark(false); };
      row.appendChild(show); row.appendChild(okB); row.appendChild(badB);
      wrap.appendChild(row);
      wrap.appendChild(model);
      card.appendChild(wrap);
    } else {
      var ul = el("ul", "choices");
      var btns = [];
      it.c.forEach(function (txt, i) {
        var li = el("li");
        var b = el("button", "", '<span class="n">' + CIRCLED[i] + "</span><span>" + fmt(txt) + "</span>");
        b.type = "button";
        b.onclick = function () { choose(i + 1); };
        btns.push(b);
        li.appendChild(b);
        ul.appendChild(li);
      });
      card.appendChild(ul);
      card.appendChild(resBox);
      var choose = function (k) {
        var v = store.get(x.id);
        v.pick = k;
        v.correct = it.a ? k === it.a : null;
        v.tries = (v.tries || 0) + 1;
        v.at = Date.now();
        store.set(x.id, v);
        paint(v);
        updateStats();
      };
      var paint = function (v) {
        btns.forEach(function (b, i) {
          b.className = "";
          if (v.pick === i + 1) b.className = v.correct ? "pick-ok" : "pick-bad";
          if (v.pick != null && it.a === i + 1) b.classList.add("answer");
        });
        card.classList.toggle("is-ok", v.correct === true);
        card.classList.toggle("is-bad", v.correct === false);
        if (v.pick == null) { resBox.innerHTML = ""; return; }
        var lead = it.a == null ? "해답 파일에 정답 표시가 없어요"
          : v.correct ? "정답! " + CIRCLED[it.a - 1] : "오답 — 정답은 " + CIRCLED[it.a - 1];
        var html = '<div class="result ' + (v.correct ? "ok" : "bad") + '"><span class="lead">' + lead + "</span>";
        if (it.e) html += "<div>" + fmt(it.e) + "</div>";
        if (it.note) html += '<div class="note">⚠ ' + fmt(it.note) + "</div>";
        html += '<div class="row"><button type="button" class="btn" data-act="retry">다시 풀기</button></div></div>';
        resBox.innerHTML = html;
        resBox.querySelector('[data-act="retry"]').onclick = function () {
          var s = store.get(x.id); delete s.pick; delete s.correct; store.set(x.id, s);
          paint(s); updateStats();
        };
      };
      paint(r);
    }

    // 메모
    var memo = el("details", "memo");
    if (r.memo) memo.open = true;
    memo.appendChild(el("summary", "", "📝 메모" + (r.memo ? " (있음)" : "")));
    var mta = el("textarea");
    mta.placeholder = "헷갈린 점, 외울 포인트 등을 적어 두세요 (자동 저장)";
    mta.value = r.memo || "";
    var saved = el("span", "saved", "저장됨");
    var t2;
    mta.oninput = function () {
      clearTimeout(t2);
      t2 = setTimeout(function () {
        var v = store.get(x.id); v.memo = mta.value; store.set(x.id, v);
        saved.classList.add("on"); setTimeout(function () { saved.classList.remove("on"); }, 900);
        memo.querySelector("summary").textContent = "📝 메모" + (mta.value.trim() ? " (있음)" : "");
      }, 300);
    };
    memo.appendChild(mta);
    memo.appendChild(saved);
    card.appendChild(memo);
    return card;
  }

  function chFilterLabel() { return multiCh; }
  var multiCh = false;

  function render() {
    listEl.innerHTML = "";
    var shown = items.filter(matches);
    if (!shown.length) {
      listEl.appendChild(el("div", "empty", "이 조건에 맞는 문제가 없어요."));
      return;
    }
    var calcStarted = false, lastCh = null;
    shown.forEach(function (x) {
      if (!x.it.calc && multiCh && x.ch !== lastCh) {
        listEl.appendChild(el("div", "section-h", x.ch + "장 · " + esc(x.chTitle)));
        lastCh = x.ch;
      }
      if (x.it.calc && !calcStarted) {
        listEl.appendChild(el("div", "section-h calc", "🧮 계산 문제"));
        calcStarted = true;
      }
      listEl.appendChild(renderItem(x));
    });
  }

  function buildToolbar(sets) {
    var tb = el("div", "toolbar noprint");
    statsEl = el("div", "stats");
    var bar = el("div", "bar"); barEl = el("i"); bar.appendChild(barEl);
    var f = el("div", "filters");
    var opts = [["all", "전체"], ["todo", "안 푼 문제"], ["wrong", "틀린 문제"], ["star", "⭐ 중요"], ["memo", "📝 메모"], ["calc", "🧮 계산"]];
    opts.forEach(function (o) {
      var b = el("button", "chip", o[1]); b.type = "button";
      b.setAttribute("aria-pressed", o[0] === filter ? "true" : "false");
      b.onclick = function () {
        filter = o[0];
        f.querySelectorAll(".chip[data-f]").forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
        render();
      };
      b.setAttribute("data-f", o[0]);
      f.appendChild(b);
    });
    if (sets.length > 1) {
      var sel = el("select", "chip");
      sel.innerHTML = '<option value="all">모든 장</option>' + sets.map(function (s) { return '<option value="' + s.ch + '">' + s.ch + "장</option>"; }).join("");
      sel.onchange = function () { chFilter = sel.value; render(); };
      f.appendChild(sel);
    }
    tb.appendChild(statsEl); tb.appendChild(bar); tb.appendChild(f);
    return tb;
  }

  function buildFooter() {
    var box = el("div", "row noprint");
    box.style.marginTop = "26px";
    var exp = el("button", "btn", "기록 백업 받기"); exp.type = "button";
    var imp = el("button", "btn", "백업 불러오기"); imp.type = "button";
    var rst = el("button", "btn", "이 페이지 기록 지우기"); rst.type = "button";
    var file = el("input"); file.type = "file"; file.accept = ".json,application/json"; file.style.display = "none";
    exp.onclick = function () {
      var blob = new Blob([JSON.stringify(store.all(), null, 1)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "os-study-기록-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
    };
    imp.onclick = function () { file.click(); };
    file.onchange = function () {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var data = JSON.parse(fr.result), n = 0;
          Object.keys(data).forEach(function (k) { if (store.set(k, data[k])) n++; });
          alert(n + "개 문제의 기록을 불러왔어요.");
          render(); updateStats();
        } catch (e) { alert("파일을 읽지 못했어요."); }
      };
      fr.readAsText(file.files[0]);
    };
    rst.onclick = function () {
      if (!confirm("이 페이지 문제들의 풀이 기록, ⭐, 메모를 모두 지울까요?")) return;
      items.forEach(function (x) { try { localStorage.removeItem(KEY + x.id); } catch (e) {} });
      render(); updateStats();
    };
    box.appendChild(exp); box.appendChild(imp); box.appendChild(rst); box.appendChild(file);
    var p = el("p", "small muted", "기록은 이 브라우저에만 저장돼요. 다른 기기로 옮기거나 브라우저 데이터를 지우기 전에는 ‘기록 백업 받기’로 파일을 받아 두세요.");
    var wrap = el("div"); wrap.appendChild(box); wrap.appendChild(p);
    return wrap;
  }

  function init() {
    root = document.getElementById("quiz");
    if (!root) return;
    var sets = collect();
    multiCh = sets.length > 1;
    root.appendChild(buildToolbar(sets));
    listEl = el("div");
    root.appendChild(listEl);
    root.appendChild(buildFooter());
    updateStats();
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
