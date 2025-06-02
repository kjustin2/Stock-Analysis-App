# Financial Adviser Application

A comprehensive financial planning application built with JavaFX and Spring Framework to help users manage their finances, investments, debts, and financial goals.

## Features

- **Financial Dashboard**: Get a quick overview of your financial status
- **Budget Management**: Track income and expenses across different categories
- **Investment Planning**: Monitor and manage your investment portfolio
- **Debt Management**: Track and plan debt repayment strategies
- **Goals Tracking**: Set and monitor progress towards financial goals

## Technical Stack

- Java 21
- JavaFX 21.0.2
- Spring Framework 6.1.4
- Hibernate 6.4.4.Final
- SQLite Database
- Log4j2 for logging
- JUnit 5 for testing

## Prerequisites

- JDK 21 or later
- Maven 3.9.5 or later
- Git

## Installation Options

### Option 1: Run the Executable (Recommended for Users)

1. Download the latest release from the releases page
2. Extract the ZIP file to your desired location
3. Double-click `FinancialAdviser.exe` to run the application

Requirements:
- Windows operating system
- Java 21 or later installed and JAVA_HOME environment variable set

### Option 2: Build from Source (For Developers)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/financial-adviser-app.git
   cd financial-adviser-app
   ```

2. Build the executable:
   ```bash
   build-exe.bat
   ```
   This will create `FinancialAdviser.exe` in the `dist` folder.

3. Run the application by double-clicking `dist/FinancialAdviser.exe`

Alternative build methods:
- Run `mvn clean package` to build just the JAR file
- Run `mvn javafx:run` to run directly through Maven

## Project Structure

```
financial-adviser-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── financialadviser/
│   │   │           ├── App.java
│   │   │           ├── config/
│   │   │           ├── controller/
│   │   │           ├── model/
│   │   │           ├── repository/
│   │   │           └── service/
│   │   └── resources/
│   │       ├── css/
│   │       ├── fxml/
│   │       └── log4j2.xml
│   └── test/
│       └── java/
└── pom.xml
```

## Database Schema

The application uses SQLite with the following main entities:
- Users
- Budgets and Budget Categories
- Transactions

## Troubleshooting

If you encounter any issues:

1. Ensure Java 21 or later is installed and JAVA_HOME is set correctly
2. Check the logs in the `logs` directory for error messages
3. Make sure all required dependencies are available
4. Verify database file permissions

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons from [FontAwesome](https://fontawesome.com/)
- Color scheme inspired by [Flat UI Colors](https://flatuicolors.com/) 