'use strict';

    //modlog
    if (modlogActions.length > 0) {
        const modlog = {};
        const logDate = new Date(); //all events current date
        const message = req.body.log_message || null;
        let logUser;
        if (res.locals.permLevel < 4) { //if staff
            logUser = req.session.user.username;
        } else {
            logUser = 'Unregistered User';
        }
        for (let i = 0; i < res.locals.posts.length; i++) {
            const post = res.locals.posts[i];
            if (!modlog[post.board]) {
                //per board actions, all actions combined to one event
                modlog[post.board] = {
                    postIds: [],
                    actions: modlogActions,
                    date: logDate,
                    showUser: !req.body.hide_name || logUser === 'Unregistered User' ? true : false,
                    message: message,
                    user: logUser,
                    ip: {
                        single: res.locals.ip.single,
                        raw: res.locals.ip.raw
                    }
                };
            }
            //push each post id
            modlog[post.board].postIds.push(post.postId);
        }
        const modlogDocuments = [];
        for (let i = 0; i < threadBoards.length; i++) {
            const boardName = threadBoards[i];
            const boardLog = modlog[boardName];
            //make it into documents for the db
            modlogDocuments.push({
                ...boardLog,
                'board': boardName
            });
        }
        if (modlogDocuments.length > 0) {
            //insert the modlog docs
            await Modlogs.insertMany(modlogDocuments);
            for (let i = 0; i < threadBoards.length; i++) {
                const board = buildBoards[threadBoards[i]];
                buildQueue.push({
                    'task': 'buildModLog',
                    'options': {
                        'board': board,
                    }
                });
                buildQueue.push({
                    'task': 'buildModLogList',
                    'options': {
                        'board': board,
                    }
                });
            }
        }
    }
