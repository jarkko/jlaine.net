#!/usr/bin/perl
# Copyright (c) Eric Soroos 2000
# Permission to use, copy, modify, distribute, and sell this software
# for any purpose is hereby granted without fee, provided that
# the above copyright notice appear in all copies and that both that
# copyright notice and this permission notice appear in supporting
# documentation.  No representations are made about the suitability of this
# software for any purpose.  It is provided "as is" without express or
# implied warranty.

# version 2.0 by Jarkko Laine 2002


$targetExtension = "(jpg)|(tif)|(bmp)"; 
$thumbnailExtension = "jpg"; 
$thumbnailSize = "192x192"; 
$mediumSize = "768x768";
$largesize = "1536x1536"; 
$thumbnailName = ".1"; 
$mediumName = ".3"; 
$lgName = ".5"; 
$pathToIm = "/usr/X11R6/bin";
$copyright = "copyright Jarkko Laine 2002";  
$largeborder = "10x10";
$mediumborder = "8x8";
$smallborder = "2x2";
$largesharpen = "0.0x1.0";
$mediumsharpen = "0.0x1.0";
$smallsharpen = "0.0x1.0";

$indexheader = "
<html>
<head>
<title>Index page</title>
</head>

<body>
<h2>Photo index</h2>
";

$indexfooter = "
</body>
</html>
";

($startDir, $destDir, $options) = @ARGV; 


opendir (START, $startDir) || die "Couldn't Open Start dir: $startDir"; 


@files = readdir(START); 
foreach $file (@files) {
    print $file;
    print "\n";
}


closedir (START); 


if (not -d $destDir) { 
    mkdir ($destDir, 0775); 
}  

open (OUTFILE, ">$destDir/index.html") or die "Couldn't open index.html"; 
open (OUTFILE2, ">$destDir/index2.html") or die "Couldn't open index2.html"; 


foreach $file (@files) {

    ($fname,$extension) = split(/\./, $file,2);

    if ($extension =~ /$targetExtension/i) { 
	print "Converting $file ...";
	`$pathToIm/convert $options -interlace NONE -comment \"$copyright\" -sharpen $largesharpen -border $largeborder -size $largesize -resize $largesize \'$startDir/$file\' \'$destDir/$fname$lgName.$thumbnailExtension\'`; 
	`$pathToIm/convert $options -interlace NONE -comment \"$copyright\" -sharpen $mediumsharpen -border $mediumborder -size $mediumSize -resize $mediumSize \"$startDir/$file\" \"$destDir/$fname$mediumName.$thumbnailExtension\"`; 
	`$pathToIm/convert -interlace NONE -sharpen $smallsharpen -border $smallborder -size $thumbnailSize -resize $thumbnailSize \"$destDir/$fname$mediumName.$thumbnailExtension\" \"$destDir/$fname$thumbnailName.$thumbnailExtension\"`; 
	
	
	print OUTFILE "
<table border=0><tr><td>
<a href=\"$fname$mediumName.$thumbnailExtension\"><img src=\"$fname$thumbnailName.$thumbnailExtension\" alt=\"$fname\"></a>
</td></tr>
<tr><td>$fname</td></tr>
</table>\n"; 
	
	print OUTFILE2 "
<table border=0><tr><td>
<a href=\"$fname$lgName.$thumbnailExtension\"><img src=\"$fname$thumbnailName.$thumbnailExtension\" alt=\"$fname\"></a>
</td></tr>
<tr><td>$fname</td></tr>
</table>\n"; 
	

	print "file converted.\n"
    } 
} 

print OUTFILE $indexfooter;
print OUTFILE2 $indexfooter;

close OUTFILE; 
close OUTFILE2;
