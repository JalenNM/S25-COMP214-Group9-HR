const oracledb = require('oracledb');

// Oracle DB configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 2,
  poolTimeout: 60
};

let pool = null;

/**
 * Initialize the Oracle database connection pool
 */
async function initializeDatabase() {
  try {
    // Set Oracle client library path if needed (Windows)
    // oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_21_9' });
    
    pool = await oracledb.createPool(dbConfig);
    console.log('Oracle DB connection pool created successfully');
    
    // Test the connection
    const connection = await pool.getConnection();
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('Database connection test successful:', result.rows[0][0]);
    await connection.close();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get a connection from the pool
 */
async function getConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

/**
 * Execute a query with parameters
 */
async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  
  try {
    connection = await getConnection();
    
    const defaultOptions = {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT
    };
    
    const result = await connection.execute(sql, binds, { ...defaultOptions, ...options });
    return result;
    
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

/**
 * Close the connection pool
 */
async function closePool() {
  if (pool) {
    try {
      await pool.close(10);
      console.log('Oracle DB connection pool closed');
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
}

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  closePool
};
