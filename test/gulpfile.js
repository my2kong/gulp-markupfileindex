var markupfileindex = require('../index');

var gulp = require('gulp');
//var fs = require('fs');


gulp.task('default', function() {
    return gulp.src('./fixture/sample.html')
        .pipe(markupfileindex({
            //filename : ''
            src_dir : 'fixture/',
            dest_dir : 'fixture/'
        }))
        .pipe(gulp.dest('./dist/'));
});
