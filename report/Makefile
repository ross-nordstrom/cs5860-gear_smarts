
all:
	pdflatex report.tex
	bibtex report.aux
	pdflatex report.tex
	pdflatex report.tex
	pdflatex report.tex
	touch build/ || mkdir build
	mv *.aux build/.
	mv *.log build/.
	mv *.bbl build/.
	mv *.blg build/.
	mv *.out build/.
	mv report.pdf Nordstrom_GearSmarts.pdf

clean:
	rm -fv *.aux *.pdf *.log *.bbl *.blg *.out
