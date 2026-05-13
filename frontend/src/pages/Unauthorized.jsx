import Layout from "../components/Layout";

const Unauthorized = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12">
        <div className="bg-white rounded-lg shadow-xl p-12 max-w-md text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition shadow-lg"
          >
            Return to Home
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Unauthorized;
