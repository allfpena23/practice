const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const terser = require("gulp-terser");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const browserSync = require("browser-sync").create();
const mode = require("gulp-mode")();
const ejs = require("gulp-ejs");
const concat = require("gulp-concat");
const rename = require("gulp-rename");

const files = {
  scssSrc: "./src/scss/**/*.scss",
  scssDest: "./assets/css",
  jsSrc: "./src/js/**/*.js",
  jsDest: "./assets/js",
  imgSrc: "./src/img/**/*.*",
  imgDest: "./assets/img",
  ejsSrc: "./views/**/*.ejs",
};

function scssTask(cb) {
  src(files.scssSrc)
    .pipe(sass().on("error", sass.logError))
    .pipe(mode.production(postcss([autoprefixer(), cssnano()])))
    .pipe(dest(files.scssDest, { sourcemaps: "." }));
  cb();
}

function jsTask(cb) {
  src([files.jsSrc], { sourcemaps: true })
    // .pipe(concat("all.js"))
    .pipe(terser())
    .pipe(dest(files.jsDest, { sourcemaps: "." }));
  cb();
}

function imgTask(cb) {
  src(files.imgSrc).pipe(dest(files.imgDest));
  cb();
}

function cacheBusterTask(cb) {
  var cbVal = new Date().getTime();
  src(["index.html", files.ejsSrc])
    .pipe(replace(/cb=\d+/g, "cb=" + cbVal))
    .pipe(dest("."));

  cb();
}

// Let the node take care of this...
// function generateHTML(cb) {
//   src("./views/**/*.ejs")
//     .pipe(ejs())
//     .pipe(rename({ extname: ".html" }))
//     .pipe(dest("./dist/public"));
// }

function bsServe(cb) {
  browserSync.init({
    server: { baseDir: "." },
    notify: {
      styles: { top: "auto", bottom: "0" },
    },
  });
  cb();
}

function bsReload(cb) {
  console.log(`Production mode: ${mode.production()}`);
  browserSync.reload();
  cb();
}

function watchTask() {
  console.log(`Production mode: ${mode.production()}`);
  watch(
    [files.scssSrc, files.jsSrc, files.imgSrc],
    { interval: 1000, usePolling: true },
    series(parallel(scssTask, jsTask, imgTask), cacheBusterTask)
  );
}

function bsWatchTask(cb) {
  console.log(`Production mode: ${mode.production()}`);
  watch("index.html", bsReload);
  watch(
    [files.scssSrc, files.jsSrc, files.imgSrc],
    { interval: 1000, usePolling: true },
    series(parallel(scssTask, jsTask, imgTask), cacheBusterTask, bsReload)
  );
  cb();
}

exports.default = series(parallel(scssTask, jsTask, imgTask), cacheBusterTask, watchTask);

exports.bs = series(parallel(scssTask, jsTask, imgTask), cacheBusterTask, bsServe, bsWatchTask);
