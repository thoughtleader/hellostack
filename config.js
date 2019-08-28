  window.$j = {
    // $j.data
    data:{
      version:"19.7.1",
      // $j.data.setup
      setup:{
        comm:null
      },
      // $j.data.comm
      comm:{
        // $j.data.comm.statusCodes
        statusCodes:["AR", "AT", "AST", "ack", "pong", "ping"],
        methods:{},
        dictionary:{
          scenes:{
            welcome:{
              message:[
                "Hi, I am the Virtual Assistant for AAA Insurance.",
                "You can chat with an agent at any time by clicking Live Agent.",
                "Here are some ways I can help you with your policy."
              ]
            },
            agentAssist:{
              message:[
                "Let me get an agent to assist you."
              ]
            },
            agentAssign:{
              message:[
                "An agent will be assigned to you shortly."
              ]
            },
            agentConnected:{
              message:[
                "You are now connected to an Agent."
              ]
            },
            agentSaysGoodbye:{
              message:[
                "Thank you for chatting with me today. We really value your feedback, and in a moment a short survey will appear. Thank you again for being a part of AAA!Have I answered all of your questions today?"
              ]
            },
            agentDisconnected:{
              message:[
                "The Live Agent chat has ended."
              ]
            },
            provideFeedback:{
              message:[
                "Do you want to provide feedback?"
              ]
            },
            providingFeedback:{
              message:[
                "(0-10 scale, 0=very dissatisfied, 10=very satisfied)",
                "accomplish your task today? (yes/no)",
                "(0-10 scale, 0=not at all likely, 10=very likely)",
                "recommend AAA Insurance to friends or family?"
              ]
            },
            // AUTO CLOSES
            providedFeedback:{
              message:[
                "Got it. thanks for the feedback",
                "Thank you for your feedback. The chat session has ended."
              ]
            },
            // AUTO CLOSES
            botThanksUser:{
              message:[
                "thank you",
                "Thank you. The chat session has ended."
              ]
            },
            endOfConversation:{
              message:[
                "endOfChatReached"
              ]
            }
          }
        }
      },
      // $j.data.options
      options:{
        autoClose:{
          delay:3000
        },
        motion:{
          //$j.data.options.motion.scrollSpeed.normal
          scrollSpeed:{
            instant:0,
            fast:200,
            normal:500,
            slow:800
          }
        }
      },
      bubble:{
        app:{
          visible:{
            initally:false
          }
        }
      }
    },
    states:{
      minimizing:null,
      maximizing:null,
      destroying:null,
      unloading:false
    },
    timers:{
      chat_clientID:null
    },
    el:{
      //$j.el.dialog
      dialog:null,
      chat:{
        window:null,
        container:null,
        scroll:null,
        liveAgent:null,
        bubble:null,
        notification:{
          message:null
        },
        master_button:null
      },
      app:{
        bubble:"#_chat_bubble",
        $:null
      }
    },
    html:{
      bubble: '<div chat="bubble">'+
        '  <div chat="notifications">'+
        '    <div></div>'+
        '  </div>'+
        '  <div chat="master_button">'+
        '    <div>'+
        '      <div chat="icon">'+
        '        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" stroke="rgb(255, 255, 255)" fill="none"><path d="M9.37 1.34h1.43a8.2 8.2 0 0 1 0 16.39H9.37a10 10 0 0 1-2.68-.45c-.55-.15-2.23 1.8-2.63 1.36s.05-2.8-.4-3.23q-.28-.27-.54-.57a8.2 8.2 0 0 1 6.26-13.5z"/><path d="M6.37 7.04h6.2m-6.2 2.62h7.94m-7.94 2.62h5.05" stroke-linecap="round"/></svg>'+
        '      </div>'+
        '    </div>'+
        '  </div>'+
        '</div>',
      message:'    <div chat="message">'+
        '       <div message="header">'+
        '         <div message="subject" />'+
        '         <div action="close">'+
        '           x'+
        '         </div>'+
        '       </div>'+
        '       <div message="body" />'+
        '    </div>'
    },
    motion:{
      defaults:{
        duration:1000,
        easing:'easeInOut'
      },
      message:{
        show:{
          duration:1,
          easing:"easeInQuint",
          afterRemoving: {
            delay:.05
          }
        },
        remove: {
          easing:'easeOutQuint',
          duration:1
        }
      },
      timelines:{
        maximize:null,
        minimize:null
      },
      animations:{
        maximize:null,
        minimize:null,
        chat:{
          expand:null,
          minimize:null,
          close:null
        },
        bubble:{
          show:{
            config:function(o) {
              return {
                targets: '[chat=bubble] > div',
                translateY: ['350px', '0px'],
                easing: 'spring(1, 80, 20, 0)'
              }
            },
            animation:null
          },
          hide: {
            config:function(o) {
              return $.extend(true, {}, $j.motion.animations.bubble.show.config(), {
                // direction: "reverse",
                easing: 'spring(1, 80, 20, 0)',
                translateY: ['0px', '350px']
              })
            },
            animation:null
          }
        }
      }
    },
    style:{
      zIndex:1500,
      colors:{
        accent:"#1778d3"
      },
      master_button:{
        backgroundColor:null,
        icon:null
      }
    },
    bot:null,
    options:{
      liveAgent:{
        button:true
      },
      bubble:{
        version:2
      }
    }
  }

  var defs = $j.motion.defaults;
  $j.motion.message.show.duration = $j.motion.message.show.duration * defs.duration;
  $j.motion.message.remove.duration = $j.motion.message.remove.duration * defs.duration;

  $j.style.master_button.backgroundColor = $j.style.colors.accent;
