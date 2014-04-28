module = angular.module('angular-unisson-auth', ['http-auth-interceptor', 'ngCookies', 'googleOauth'])

class LoginService   
        """
        Login a user
        """
        constructor: (@$rootScope, @$http, @$state, @loginRestangular, @$cookies, @authService, @Token) ->
                @$rootScope.authVars =                        
                        username : "",
                        isAuthenticated: false,
                        loginrequired : false

                # On login required
                @$rootScope.$on('event:auth-loginRequired', =>
                        @$rootScope.authVars.loginrequired = true
                        console.debug("Login required")
                )

                # On login successful
                @$rootScope.$on('event:auth-loginConfirmed', =>
                        console.debug("Login OK")
                        @$rootScope.authVars.loginrequired = false
                        @$rootScope.authVars.username = @$cookies.username
                        @$rootScope.authVars.isAuthenticated = true
                )

                # set authorization header if already logged in
                if @$cookies.username and @$cookies.key
                        console.debug("Already logged in.")
                        @$http.defaults.headers.common['Authorization'] = "ApiKey #{@$cookies.username}:#{@$cookies.key}"
                        @authService.loginConfirmed()


                @$rootScope.accessToken = @Token.get()

                # Add methods to scope
                @$rootScope.submit = this.submit
                @$rootScope.authenticateGoogle = this.authenticateGoogle
                @$rootScope.forceLogin = this.forceLogin
                @$rootScope.logout = this.logout

        forceLogin: =>
                console.debug("forcing login")
                @$rootScope.authVars.loginrequired = true
                console.debug(@$rootScope.authVars.loginrequired)
        logout: =>
                @$rootScope.authVars.isAuthenticated = false
                delete @$http.defaults.headers.common['Authorization']
                delete @$cookies['username']
                delete @$cookies['key']
                @$rootScope.authVars.username = ""

                @$state.go(@$rootScope.homeStateName, {}, {reload:true})

 
        submit: =>
                console.debug('submitting login...')
                @loginRestangular.all('account/user').customPOST(
                        {username: @$rootScope.authVars.username, password: @$rootScope.authVars.password},"login", {}
                        ).then((data) =>
                                console.log(data)
                                @$cookies.username = data.username
                                @$cookies.key = data.key
                                @$rootScope.authVars.profile_id = data.profile_id
                                @$http.defaults.headers.common['Authorization'] = "ApiKey #{data.username}:#{data.key}"
                                @authService.loginConfirmed()
                        , (data) =>
                                console.debug("LoginController submit error: #{data.reason}")
                                @$rootScope.errorMsg = data.reason
                )

        authenticateGoogle: =>
                extraParams = {}
                if @$rootScope.askApproval
                        extraParams = {approval_prompt: 'force'}

                @Token.getTokenByPopup(extraParams).then((params) =>

                        # Verify the token before setting it, to avoid the confused deputy problem.
                        @loginRestangular.all('account/user/login').customPOST("google", {}, {},
                                access_token: params.access_token
                        ).then((data) =>
                                @$cookies.username = data.username
                                @$cookies.key = data.key
                                @$http.defaults.headers.common['Authorization'] = "ApiKey #{data.username}:#{data.key}"
                                @authService.loginConfirmed()
                        , (data) =>
                                console.debug("LoginController submit error: #{data.reason}")
                                @$rootScope.errorMsg = data.reason
                        )
                , ->
                        # Failure getting token from popup.
                        alert("Failed to get token from popup.")
                )



#Login Restangular service that needs rootScope variable configuration
module.factory('loginRestangular', ['$rootScope','Restangular', ($rootScope, Restangular) ->
        console.debug(" Setting login base url : "+ $rootScope.loginBaseUrl)
        return Restangular.withConfig( (RestangularConfigurer) ->
                RestangularConfigurer.setBaseUrl($rootScope.loginBaseUrl)
        )
])

module.factory("loginService", ['$rootScope', "$http", "$state", "loginRestangular", "$cookies", "authService", "Token", ($rootScope, $http, $state, loginRestangular, $cookies, authService, Token) ->
        console.debug("init unisson auth service")
        return new LoginService($rootScope, $http, $state, loginRestangular, $cookies, authService, Token)
])
