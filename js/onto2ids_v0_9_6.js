/* SPDX-License-Identifier: Apache-2.0
   Copyright © 2024 Sander Stolk */

class Onto2ids_v0_9_6 {

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
`<ids:ids xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/0.9.6/ids.xsd" xmlns:ids="http://standards.buildingsmart.org/IDS">
  <ids:info>
    <ids:title>${idsInfo.title}</ids:title>
    <ids:author>${idsInfo.author}</ids:author>
    <ids:date>${idsInfo.date}</ids:date>
  </ids:info>

  <ids:specifications>`;

        idsXML += `
    <ids:specification ifcVersion="${idsInfo.ifcVersion}" name="${ontoInfo.DomainName} - Classification" minOccurs="0" maxOccurs="unbounded" description="All objects are required to be classified according to the data dictionary ${ontoInfo.DomainName}">
      <ids:applicability>
        <ids:entity>
          <ids:name>
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
			} else if (idsInfo.ifcVersion == "IFC4X3") {
				for (const ifcClassName of IFC4X3_CLASSNAMES) {
					idsXML += `
					<xs:enumeration value="${ifcClassName}" />`;
				}
			} else {}
			
			idsXML += `
            </xs:restriction>
          </ids:name>
        </ids:entity>
      </ids:applicability>
      <ids:requirements>
        <ids:classification minOccurs="1" maxOccurs="unbounded">
          <ids:system>
            <ids:simpleValue>${ontoInfo.DomainName}</ids:simpleValue>
          </ids:system>
        </ids:classification>
      </ids:requirements>
    </ids:specification>`;
  
		for (const [ontoClassURI, specObjects] of Object.entries(csvObjectsGrouped)) {
			idsXML += `
    <ids:specification ifcVersion="${idsInfo.ifcVersion}" name="${ontoInfo.DomainName} - ${specObjects[0].ontoClassPrefLabel}" minOccurs="0" maxOccurs="unbounded" description="Requirements for: ${specObjects[0].ontoClassPrefLabel}">
      <ids:applicability>
        <ids:classification>
          <ids:value>
            <ids:simpleValue>${this.getLocalname(ontoClassURI)}</ids:simpleValue>
          </ids:value>
          <ids:system>
            <ids:simpleValue>${ontoInfo.DomainName}</ids:simpleValue>
          </ids:system>
        </ids:classification>
      </ids:applicability>
      <ids:requirements>`
			if (specObjects[0].ifcClassLabel) {
				idsXML += `
        <ids:entity>
          <ids:name>
            <xs:restriction base="xs:string">
              <xs:enumeration value="${specObjects[0].ifcClassLabel}" />
            </xs:restriction>
          </ids:name>
        </ids:entity>`;
			}
			for (const specObject of specObjects) {
				if (!specObject.ontoPropertyPrefLabel || specObject.ontoPropertyPrefLabel=="") {
					continue;
				}
				
				// note: the maxOccurs attribute for a property has to be either 0 (prohibited) or 'unbounded' (optional or required, depending on value of minOccurs); any other number is not allowed in the IDS specification at the time of writing (v0.9.6).
				idsXML += `
        <ids:property datatype="${specObject.ontoPropertyDatatype || 'IFCTEXT'}" minOccurs="${specObject.ontoPropertyCardinalityMin || 0}" maxOccurs="${(specObject.ontoPropertyCardinalityMax && specObject.ontoPropertyCardinalityMax==0) ? 0 : 'unbounded'}">
          <ids:propertySet>
            <ids:simpleValue>${ontoInfo.DomainName}</ids:simpleValue>
          </ids:propertySet>
          <ids:name>
            <ids:simpleValue>${specObject.ontoPropertyPrefLabel}</ids:simpleValue>
          </ids:name>`;
				if (specObject.ontoPropertyEnumValues) {
					idsXML += `
		  <ids:value>
		    <xs:restriction base="xs:string">`;
					for (const enumValue of specObject.ontoPropertyEnumValues.split("|")) {
						idsXML += `
              <xs:enumeration value="${enumValue}" />`;
					}
					idsXML += `
            </xs:restriction>
          </ids:value>`;
				}
				idsXML += `
        </ids:property>`;
			}
		
			idsXML += `
      </ids:requirements>
    </ids:specification>`;
		}
		
		idsXML += `
  </ids:specifications>
</ids:ids>`;		
		
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