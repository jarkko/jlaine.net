<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

<xsl:output method="html" indent="yes" encoding="iso-8859-1"/>

<xsl:template match="/book">
	<html>
	<head>
		<title><xsl:value-of select="bookinfo/title"/></title>
	</head>
	<body>
		<h1><xsl:value-of select="bookinfo/title"/></h1>
		<p align="center"><em>
		<xsl:value-of select="bookinfo/author/surname"/>,
		<xsl:value-of select="bookinfo/author/firstname"/>
		</em></p>
		
		<p><strong>Esipuhe:</strong>
		<xsl:value-of select="preface"/>
		</p>

		<xsl:for-each select="chapter">
			<h2><xsl:value-of select="title"/></h2>
			<xsl:for-each select="para">
				<p><xsl:value-of select="string()"/></p>
			</xsl:for-each>
		</xsl:for-each>

</body>
</html>

</xsl:template>
</xsl:stylesheet>



























