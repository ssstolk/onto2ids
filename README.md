# onto2ids
Tooling to generate an [IDS](https://github.com/buildingSMART/IDS/) based on a knowledge graph expressed in linked data.
Currently, its use relies on the ontology also having been distributed in the bSDD (see [onto2bsdd](https://github.com/ssstolk/onto2bsdd)).

## Give it a try
* Download the source code
* Store the source code (uncompressed) in a folder on your local computer or on webhosting
* Open convert.html in an internet browser
* On this newly opened webpage
  * adjust the metadata to represent the organisation/ontology concerned [optional]
  * select a CSV file containing information on the ontology; adhering to a specific structure (*)
* The IDS is automatically generated and downloaded as a file

(*) See the example CSV of (a part of) the [Waternet ontology](https://otl.waternet.nl) in the subfolder "onto/waternet". This folder also includes the SPARQL query used to obtain that CSV and the results of the generation of the IDS.

## Technical documentation
For further details on the tooling and its use, we refer the reader to the [technical report](https://github.com/ssstolk/onto2ids/blob/main/docs/Towards%20ontology-driven%20information%20exchange%20at%20Waternet.pdf) included in the docs folder.
