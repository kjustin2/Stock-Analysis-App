# Financial Adviser Application

A Java application for financial advice and management.

## Prerequisites

- Java JDK 17 or higher
- Maven 3.6.0 or higher

## Building the Project

To build the project, run:

```bash
mvn clean install
```

## Running Tests

To run the tests:

```bash
mvn test
```

## Running the Application

To run the application:

```bash
mvn exec:java -Dexec.mainClass="com.financialadviser.App"
```

## Project Structure

```
financial-adviser-app/
├── src/
│   ├── main/java/
│   │   └── com/financialadviser/
│   │       └── App.java
│   └── test/java/
│       └── com/financialadviser/
│           └── AppTest.java
├── pom.xml
├── .gitignore
└── README.md
``` 