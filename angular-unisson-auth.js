(function() {
  var LoginService, module,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module = angular.module('angular-unisson-auth', ['http-auth-interceptor', 'ngCookies', 'googleOauth']);

  LoginService = (function() {
    "Login a user";
    function LoginService($rootScope, $http, $state, Restangular, $cookies, authService, Token) {
      var _this = this;
      this.$rootScope = $rootScope;
      this.$http = $http;
      this.$state = $state;
      this.Restangular = Restangular;
      this.$cookies = $cookies;
      this.authService = authService;
      this.Token = Token;
      this.authenticateGoogle = __bind(this.authenticateGoogle, this);
      this.submit = __bind(this.submit, this);
      this.logout = __bind(this.logout, this);
      this.forceLogin = __bind(this.forceLogin, this);
      this.$rootScope.authVars = {
        username: "",
        isAuthenticated: false,
        loginrequired: false
      };
      this.$rootScope.$on('event:auth-loginRequired', function() {
        _this.$rootScope.authVars.loginrequired = true;
        return console.debug("Login required");
      });
      this.$rootScope.$on('event:auth-loginConfirmed', function() {
        console.debug("Login OK");
        _this.$rootScope.authVars.loginrequired = false;
        _this.$rootScope.authVars.username = _this.$cookies.username;
        return _this.$rootScope.authVars.isAuthenticated = true;
      });
      if (this.$cookies.username && this.$cookies.key) {
        console.debug("Already logged in.");
        this.$http.defaults.headers.common['Authorization'] = "ApiKey " + this.$cookies.username + ":" + this.$cookies.key;
        this.authService.loginConfirmed();
      }
      this.$rootScope.accessToken = this.Token.get();
      this.$rootScope.submit = this.submit;
      this.$rootScope.authenticateGoogle = this.authenticateGoogle;
      this.$rootScope.forceLogin = this.forceLogin;
      this.$rootScope.logout = this.logout;
    }

    LoginService.prototype.forceLogin = function() {
      console.debug("forcing login");
      this.$rootScope.authVars.loginrequired = true;
      return console.debug(this.$rootScope.authVars.loginrequired);
    };

    LoginService.prototype.logout = function() {
      this.$rootScope.authVars.isAuthenticated = false;
      delete this.$http.defaults.headers.common['Authorization'];
      delete this.$cookies['username'];
      delete this.$cookies['key'];
      this.$rootScope.authVars.username = "";
      return this.$state.go('index');
    };

    LoginService.prototype.submit = function() {
      var _this = this;
      console.debug('submitting login...');
      return this.Restangular.all('account/user').customPOST("login", {}, {}, {
        username: this.$rootScope.authVars.username,
        password: this.$rootScope.authVars.password
      }).then(function(data) {
        _this.$cookies.username = data.username;
        _this.$cookies.key = data.key;
        _this.$http.defaults.headers.common['Authorization'] = "ApiKey " + data.username + ":" + data.key;
        return _this.authService.loginConfirmed();
      }, function(data) {
        console.debug("LoginController submit error: " + data.reason);
        return _this.$rootScope.errorMsg = data.reason;
      });
    };

    LoginService.prototype.authenticateGoogle = function() {
      var extraParams,
        _this = this;
      extraParams = {};
      if (this.$rootScope.askApproval) {
        extraParams = {
          approval_prompt: 'force'
        };
      }
      return this.Token.getTokenByPopup(extraParams).then(function(params) {
        return _this.Restangular.all('account/user/login').customPOST("google", {}, {}, {
          access_token: params.access_token
        }).then(function(data) {
          _this.$cookies.username = data.username;
          _this.$cookies.key = data.key;
          _this.$http.defaults.headers.common['Authorization'] = "ApiKey " + data.username + ":" + data.key;
          return _this.authService.loginConfirmed();
        }, function(data) {
          console.debug("LoginController submit error: " + data.reason);
          return _this.$rootScope.errorMsg = data.reason;
        });
      }, function() {
        return alert("Failed to get token from popup.");
      });
    };

    return LoginService;

  })();

  module.factory("loginService", [
    '$rootScope', "$http", "$state", "Restangular", "$cookies", "authService", "Token", function($rootScope, $http, $state, Restangular, $cookies, authService, Token) {
      console.debug("init unisson auth service");
      return new LoginService($rootScope, $http, $state, Restangular, $cookies, authService, Token);
    }
  ]);

}).call(this);
