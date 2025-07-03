Processing steps:
1. 3D model of integrated land and marine cadastre already created in Blender. For details: /myfyp (2)/myfyp/model/Steps to create 3D model in Blender and upload it to Cesium ion.docx
2. The 3D model exported as COLLADA (.dae) and import to Google Earth Pro for georeferencing.
3. The georeferenced 3D model exported as .kmz and import to FME for data transformation.
4. In FME, used the transformer 'deaggregator' and 'featureMerger' (import csv to insert the data).
For details:
- /myfyp (2)/myfyp/model/version4.fmw (FME Workbence File)
- /myfyp (2)/myfyp/database/Mapping between 3D objects and tables.xlsx (convert to csv file and import to FME for feature merger)
5. Export as Cesium 3D Tiles, and zip.
- /myfyp (2)/myfyp/model/data (2).zip (zip file that uploaded to Cesium ion)
6. Upload the zip file to Cesium ion.
7. The data structure (csv) of database had developed in PostgreSQL-PostGIS.
- /myfyp (2)/myfyp/database/Database lexisdb.txt (database schema that developed in PostgreSQL-PostGIS)
8. The model in Cesium ion has visualized on web-based by using HTML, CSS, and JS, the web-based also developed with backend technologies.