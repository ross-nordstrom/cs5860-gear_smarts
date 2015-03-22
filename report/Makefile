
all:
	pdflatex proposal.tex
	bibtex proposal.aux
	pdflatex proposal.tex
	pdflatex proposal.tex
	pdflatex proposal.tex
	touch build/ || mkdir build
	mv *.aux build/.
	mv *.log build/.
	mv *.bbl build/.
	mv *.blg build/.
	mv *.out build/.
	mv proposal.pdf Nordstrom_GearSmarts.pdf

clean:
	rm -fv *.aux *.pdf *.log *.bbl *.blg *.out
