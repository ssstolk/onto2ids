/* SPDX-License-Identifier: Apache-2.0
   Copyright © 2024 Sander Stolk & Quint Netten */

class Onto2ids_v1_0 {

    /* Transforms input CSV content to buildingSMART IDS in its XML format.
	   For documentation on the buildinSMART IDS, see: https://github.com/buildingSMART/IDS/ .
	   
       @param input: CSV headed by the following column names:	   
       - ?ontoClassPrefLabel         human-readable name for an ontology class
       - ?ontoClassURI               unique resource identifier for the ontology class
       - ?ifcClassLabel              counterpart IFC entity (e.g. IfcDoor)
       - ?ontoPropertyPrefLabel      human-readable name for an ontology property relevant for the class
       - ?ontoPropertyURI            unique resource identifier for the ontology property
       - ?ontoPropertyDatatype       property requirements: datatype
       - ?ontoPropertyEnumValues     property requirements: enumeration values
       - ?ontoPropertyCardinalityMin property requirements: min cardinality
       - ?ontoPropertyCardinalityMax property requirements: max cardinality
       @param ontoInfo: JSON object with fields 'OrganizationCode', 'DomainName', 'DomainCode', 'DomainVersion'
	   @param idsInfo: JSON object with fields 'title', 'author', 'date', 'ifcVersion' 
	   @param idsVersion: Drop down menu for executing different scripts based on the IDS version
    */
    static fromCSV(input, ontoInfo, idsInfo) {

        const csvObjects = $.csv.toObjects(input); // see https://github.com/evanplaice/jquery-csv/#documentation		
		const csvObjectsGrouped = this.groupBy(csvObjects, "ontoClassURI");
		console.log(JSON.stringify(csvObjectsGrouped));

		let idsXML =
`<?xml version="1.0" encoding="utf-8"?>
<ids xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/1.0/ids.xsd" xmlns="http://standards.buildingsmart.org/IDS">
  
  <info>
    <title>${idsInfo.title}</title>
    <author>${idsInfo.author}</author>
    <date>${idsInfo.date}</date>
  </info>

  <specifications>`;

        idsXML += `
    <specification ifcVersion="${idsInfo.ifcVersion}" name="${ontoInfo.DomainName} - Classification" description="All objects are required to be classified according to the data dictionary ${ontoInfo.DomainName}">
      <applicability minOccurs="0" maxOccurs="unbounded">
        <entity>
          <name>
            <xs:restriction base="xs:string">`;

			if (idsInfo.ifcVersion == "IFC2X3") {
				for (const ifcClassName of IFC2X3_CLASSNAMES) {
					idsXML += `
					<xs:enumeration value="${ifcClassName}" />`;
				}
			} else if (idsInfo.ifcVersion == "IFC4") {
				for (const ifcClassName of IFC4_CLASSNAMES) {
					idsXML += `
					<xs:enumeration value="${ifcClassName}" />`;
				}
			} else if (idsInfo.ifcVersion == "IFC4X3_ADD2") {
				for (const ifcClassName of IFC4X3_CLASSNAMES) {
					idsXML += `
					<xs:enumeration value="${ifcClassName}" />`;
				}
			}
			
			idsXML += `
            </xs:restriction>
          </name>
        </entity>
      </applicability>
      <requirements>
        <classification cardinality="required">
          <system>
            <simpleValue>${ontoInfo.DomainName}</simpleValue>
          </system>
        </classification>
      </requirements>
    </specification>`;
  
		for (const [ontoClassURI, specObjects] of Object.entries(csvObjectsGrouped)) {
			idsXML += `
    <specification ifcVersion="${idsInfo.ifcVersion}" name="${ontoInfo.DomainName} - ${specObjects[0].ontoClassPrefLabel}" description="Requirements for: ${specObjects[0].ontoClassPrefLabel}">
      <applicability minOccurs="0" maxOccurs="unbounded">
        <classification>
          <value>
            <simpleValue>${this.getLocalname(ontoClassURI)}</simpleValue>
          </value>
          <system>
            <simpleValue>${ontoInfo.DomainName}</simpleValue>
          </system>
        </classification>
      </applicability>
      <requirements>`
			if (specObjects[0].ifcClassLabel) {
				idsXML += `
        <entity>
          <name>
            <xs:restriction base="xs:string">
              <xs:enumeration value="${specObjects[0].ifcClassLabel}" />
            </xs:restriction>
          </name>
        </entity>`;
			}
			for (const specObject of specObjects) {
				if (!specObject.ontoPropertyPrefLabel || specObject.ontoPropertyPrefLabel=="") {
					continue;
				}
				
			
				// note: cardinality attribute for a property has to be either prohibited, optional or required; any other option is not allowed in the IDS specification (v0.9.7).
				
				var PropertyCardinality;
				if	(specObject.ontoPropertyCardinalityMax == 0) {
					  PropertyCardinality = "prohibited" ;
				} else if(specObject.ontoPropertyCardinalityMin == 0) {
					PropertyCardinality  = "optional" ;
				} else {
					PropertyCardinality  = "required";
				}
				
				console.log(PropertyCardinality);
				
				idsXML += `
        <property dataType="${specObject.ontoPropertyDatatype || 'IFCTEXT'}" cardinality="${PropertyCardinality}">
          <propertySet>
            <simpleValue>${ontoInfo.DomainName}</simpleValue>
          </propertySet>
          <baseName>
            <simpleValue>${specObject.ontoPropertyPrefLabel}</simpleValue>
          </baseName>`;
				if (specObject.ontoPropertyEnumValues) {
					idsXML += `
		  <value>
		    <xs:restriction base="xs:string">`;
					for (const enumValue of specObject.ontoPropertyEnumValues.split("|")) {
						idsXML += `
              <xs:enumeration value="${enumValue}" />`;
					}
					idsXML += `
            </xs:restriction>
          </value>`;
				}
				idsXML += `
        </property>`;
			}
		
			idsXML += `
      </requirements>
    </specification>`;
		}
		
		idsXML += `
  </specifications>
</ids>`;		
		
		return idsXML;
    }
	
	
	static groupBy(objects, propertyName) {
		const result = {};
		for (const object of objects) {
			const propertyValue = (propertyName in object) ? object[propertyName] : "undefined";
			result[propertyValue] = (propertyValue in result) ? result[propertyValue] : [];
			result[propertyValue].push(object);
		}
		return result;
	}


    static getLocalname(uri) {
        if (uri.includes("#")) return uri.split('#').pop(); 
        return uri.split('/').pop();
    }
}
