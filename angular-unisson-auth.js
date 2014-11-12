// Generated by CoffeeScript 1.4.0
(function() {
  var LoginService, module,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module = angular.module('angular-unisson-auth', ['http-auth-interceptor', 'ngCookies', 'googleOauth', 'restangular']);

  module.factory('Groups', function(Restangular) {
    return Restangular.service('account/group');
  });

  module.factory('Users', function(Restangular) {
    return Restangular.service('account/user');
  });

  LoginService = (function() {
    "Login a user";

    function LoginService($rootScope, baseUrl, $http, $state, Restangular, $cookies, authService, Token) {
      var _this = this;
      this.$rootScope = $rootScope;
      this.baseUrl = baseUrl;
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
      this.loginRestangular = Restangular.withConfig(function(RestangularConfigurer) {
        return RestangularConfigurer.setBaseUrl(baseUrl);
      });
      this.$rootScope.$on('event:auth-loginRequired', function() {
        _this.$rootScope.authVars.loginrequired = true;
        return console.debug("Login required");
      });
      this.$rootScope.$on('event:auth-loginConfirmed', function() {
        console.debug("Login OK");
        _this.$rootScope.authVars.loginrequired = false;
        _this.$rootScope.authVars.username = _this.$cookies.username;
        _this.$rootScope.authVars.isAuthenticated = true;
        return _this.loginRestangular.all('account/user').get(_this.$cookies.username).then(function(data) {
          console.log("user object", data);
          return _this.$rootScope.authVars.user = data;
        });
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
      console.debug("forcing login on request");
      return this.$rootScope.authVars.loginrequired = true;
    };

    LoginService.prototype.logout = function() {
      this.$rootScope.authVars.isAuthenticated = false;
      delete this.$http.defaults.headers.common['Authorization'];
      delete this.$cookies['username'];
      delete this.$cookies['key'];
      this.$rootScope.authVars.username = "";
      if (this.$rootScope.homeStateName) {
        return this.$state.go(this.$rootScope.homeStateName, {}, {
          reload: true
        });
      }
    };

    LoginService.prototype.submit = function() {
      var _this = this;
      console.debug('submitting login...');
      return this.loginRestangular.all('account/user').customPOST({
        username: this.$rootScope.authVars.username,
        password: this.$rootScope.authVars.password
      }, "login", {}).then(function(data) {
        console.log(data);
        _this.$cookies.username = data.username;
        _this.$cookies.key = data.key;
        _this.$http.defaults.headers.common['Authorization'] = "ApiKey " + data.username + ":" + data.key;
        return _this.loginRestangular.all('account/user').get(data.username).then(function(data) {
          console.log("user object", data);
          _this.$rootScope.authVars.user = data;
          return _this.authService.loginConfirmed();
        });
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
        return _this.loginRestangular.all('account/user/login').customPOST({
          access_token: params.access_token
        }, "google", {}).then(function(data) {
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

  module.provider("loginService", function() {
    return {
      setBaseUrl: function(baseUrl) {
        return this.baseUrl = baseUrl;
      },
      $get: function($rootScope, $http, $state, Restangular, $cookies, authService, Token) {
        return new LoginService($rootScope, this.baseUrl, $http, $state, Restangular, $cookies, authService, Token);
      }
    };
  });

}).call(this);
